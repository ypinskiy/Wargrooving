const express = require( 'express' );
const https = require( 'https' );
const st = require( 'st' );
const helmet = require( 'helmet' );
const moment = require( 'moment' );
const bodyParser = require( 'body-parser' );
const compression = require( 'compression' );
const multer = require( "multer" );
const fs = require( 'fs' );
const lunr = require( 'lunr' );

let storage = multer.diskStorage( {
	destination: function ( req, file, cb ) {
		cb( null, __dirname + '/static/assets/uploaded' );
	},
	filename: function ( req, file, cb ) {
		let filename = req.body.code;
		req.mimetype = file.mimetype;
		switch ( file.mimetype ) {
			case "image/png":
				filename += ".png";
				break;
			case "image/jpeg":
				filename += ".jpeg";
				break;
			case "image/gif":
				filename += ".gif";
				break;
		}
		cb( null, filename );
	}
} )

function fileFilter( req, file, cb ) {
	if ( maps.filter( map => map.code === req.body.code ).length > 0 ) {
		console.log( "File Filter: Map with this code already exists." );
		req.CodeAlreadyExistsError = true;
		cb( null, false );
	} else {
		cb( null, true );
	}
}

const upload = multer( { storage: storage, fileFilter: fileFilter } ).single( 'screenshot' );

function ReadMaps( dirname, onFileContent, onError ) {
	fs.readdir( dirname, function ( err, filenames ) {
		if ( err ) {
			onError( err );
			return;
		}
		filenames.forEach( function ( filename ) {
			fs.readFile( dirname + filename, 'utf-8', function ( err, content ) {
				if ( err ) {
					onError( err );
					return;
				}
				onFileContent( filename, content );
			} );
		} );
	} );
}

let tagsMapper = {
	"1player": "1 Player",
	"2player": "2 Player",
	"3player": "3 Player",
	"4player": "4 Player",
	"easy": "Easy",
	"hard": "Hard",
	"crossover": "Crossover",
	"historical": "Historical",
	"asymmetrical": "Asymmetrical",
	"symmetrical": "Symmetrical",
	"small": "Small Size",
	"medium": "Medium Size",
	"large": "Large Size",
	"quests": "Quests",
	"puzzle": "Puzzle",
	"grinding": "Grinding",
	"coop": "Co-Op",
	"pvp": "PvP",
	"campaign": "Campaign",
	"skirmish": "Skirmish",
	"scenario": "Scenario",
	"air": "Air",
	"land": "Land",
	"sea": "Sea",
	"story": "Story Driven",
	"alternate": "Alternate Victory Conditions"
};

let maps = [];
ReadMaps( __dirname + '/static/maps/', function ( filename, content ) {
	maps.push( JSON.parse( content ) );
}, function ( error ) {
	console.log( "Error reading maps: " + error );
} );

let app = express();
if ( process.env.sslEnabled === "true" ) {
	const options = {
		cert: fs.readFileSync( __dirname + '/sslcert/fullchain.pem' ),
		key: fs.readFileSync( __dirname + '/sslcert/privkey.pem' )
	};
	let sslServer = https.createServer( options, app );
	sslServer.listen( 443 );
} else {
	let server = require( 'http' ).createServer( app );
	server.listen( 80 );
}
app.set( 'json spaces', 0 );
app.use( helmet() );
app.use( compression() );
app.use( bodyParser.json() );
app.use( bodyParser.urlencoded( {
	extended: true
} ) );

function SortByStarsDesc( a, b ) {
	return b.stars - a.stars;
}

function SortByStarsAsc( a, b ) {
	return a.stars - b.stars;
}

function SortByDateNewest( a, b ) {
	return b.created_at - a.created_at;
}

function SortByDateOldest( a, b ) {
	return a.created_at - b.created_at;
}

app.get( '/tags', function ( req, res ) {
	res.json( tagsMapper );
} );

app.get( '/featuredmaps', function ( req, res ) {
	let recentMaps = maps.filter( map => moment().diff( moment( map.created_at ), 'days' ) <= 14 );
	recentMaps.sort( SortByStarsDesc );
	console.log( "Featured Maps: ", recentMaps.slice( 0, 5 ) );
	res.json( { maps: recentMaps.slice( 0, 5 ), tags: tagsMapper } );
} );

app.post( '/uploadmap', function ( req, res ) {
	upload( req, res, function ( error ) {
		if ( req.CodeAlreadyExistsError ) {
			console.log( `Upload: Map with this code ${req.body.code} already exists.` );
			return res.json( { error: true, message: "Map with this code already exists." } );
		} else {
			let mapJSON = req.body;
			mapJSON.stars = 0;
			mapJSON.mimetype = req.mimetype;
			mapJSON.created_at = new Date().getTime();
			if ( typeof mapJSON.tags === "string" ) {
				mapJSON.tags = [ mapJSON.tags ];
			}
			fs.writeFile( __dirname + '/static/maps/' + req.body.code + ".json",
				JSON.stringify( mapJSON, null, '\t' ),
				function ( err ) {
					if ( err ) {
						return console.log( err );
					}
					console.log( `The map file for ${mapJSON.code} was saved!` );
				} );
			maps.push( req.body );
			return res.json( { error: false, message: "Map successfully uploaded.", code: mapJSON.code } );
		}
	} );
} );

app.use( st( {
	path: __dirname + '/static',
	url: '/',
	index: '/index.html',
	gzip: true,
	dot: true,
	cors: false,
	cache: {
		content: {
			max: 1024 * 1024 * 64,
			maxAge: false
		}
	},
	passthrough: true
} ) );

app.get( '/upload', function ( req, res ) {
	res.sendFile( __dirname + '/static/upload.html' );
} );

app.get( '/maps/:code', function ( req, res ) {
	res.sendFile( __dirname + '/static/maps.html' );
} );

app.get( '/searcher', function ( req, res ) {
	res.sendFile( __dirname + '/static/search.html' );
} );

app.get( '/creator/:code', function ( req, res ) {
	res.sendFile( __dirname + '/static/creator.html' );
} );

app.get( '/getbycreator', function ( req, res ) {
	let mapsByCreator = maps.filter( map => map.creator.toLowerCase() === req.query.creator.toLowerCase() );
	res.json( { maps: mapsByCreator, tags: tagsMapper } );
} );

function arrayContainsArray( superset, subset ) {
	if ( 0 === subset.length ) {
		return false;
	}
	return subset.every( function ( value ) {
		return ( superset.indexOf( value ) >= 0 );
	} );
}

app.get( '/search', function ( req, res ) {
	console.log( "Search incoming: ", req.query );
	let filteredMaps = maps;
	if ( req.query.tags ) {
		filteredMaps = filteredMaps.filter( map => arrayContainsArray( map.tags, req.query.tags.split( " " ) ) );
	}
	if ( req.query.dateFilter ) {
		if ( req.query.dateFilter === "2" ) {
			filteredMaps = filteredMaps.filter( map => moment().diff( moment( map.created_at ), 'days' ) <= 7 );
		} else if ( req.query.dateFilter === "1" ) {
			filteredMaps = filteredMaps.filter( map => moment().diff( moment( map.created_at ), 'days' ) <= 30 );
		}
	}
	let index = lunr( function () {
		this.ref( 'code' );
		this.field( 'title' );
		this.field( 'description' );
		this.field( 'creator' );

		filteredMaps.forEach( function ( doc ) {
			this.add( doc )
		}, this )
	} );
	let mergedFiltersMaps = [];
	if ( req.query.terms ) {
		let filteredMapIndices = index.search( req.query.terms + '~2' );
		filteredMapIndices.forEach( function ( mapIndex ) {
			mergedFiltersMaps.push( filteredMaps.find( map => map.code === mapIndex.ref ) );
		} );
	} else {
		mergedFiltersMaps = filteredMaps;
	}
	if ( req.query.sort ) {
		switch ( req.query.sort ) {
			case "2":
				mergedFiltersMaps.sort( SortByDateNewest );
				break;
			case "1":
				mergedFiltersMaps.sort( SortByDateOldest );
				break;
			case "3":
				mergedFiltersMaps.sort( SortByStarsDesc );
				break;
			case "4":
				mergedFiltersMaps.sort( SortByStarsAsc );
				break;
		}
	}
	console.log( `Search returned ${mergedFiltersMaps.length} maps.` );
	res.json( mergedFiltersMaps.slice( 0, 30 ) );
} );

app.post( '/updatestars', function ( req, res ) {
	console.log( req.body );
	let updatedMapIndex = maps.findIndex( map => map.code === req.body.code );
	console.log( "Map's current state: ", maps[ updatedMapIndex ] );
	if ( req.body.operation === "add" ) {
		maps[ updatedMapIndex ].stars++;
	} else {
		maps[ updatedMapIndex ].stars--;
	}
	console.log( "Map's updated state: ", maps[ updatedMapIndex ] );
	fs.writeFile( __dirname + '/static/maps/' + req.body.code + ".json",
		JSON.stringify( maps[ updatedMapIndex ], null, '\t' ),
		function ( err ) {
			console.log( "Finished updating new stars for map: " + maps[ updatedMapIndex ].code );
		} );
	res.sendStatus( 200 );
} );
