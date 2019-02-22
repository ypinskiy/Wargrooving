let map = {};
let starredMaps = [];

if ( !localStorage.starredMaps ) {
	localStorage.starredMaps = [];
} else {
	starredMaps = JSON.parse( localStorage.starredMaps );
}

fetch( `/maps/${window.location.pathname.split( "/" )[ 2 ]}.json`, { cache: "no-store" } )
	.then( response => response.json() )
	.then( function ( mapData ) {
		document.title = mapData.title;
		fetch( "/tags", { cache: "no-store" } ).then( response => response.json() )
			.then( function ( tagsData ) {
				map = mapData;
				let filename = `/assets/uploaded/${mapData.code}`;
				switch ( mapData.mimetype ) {
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
				document.getElementById( "map-img" ).src = filename;
				document.getElementById( "map-title" ).textContent = mapData.title;
				document.getElementById( "map-code" ).textContent = "Code: " + mapData.code;
				document.getElementById( "map-author" ).textContent = "By " + mapData.creator;
				document.getElementById( "map-author" ).href = `/creator/${mapData.creator}`;
				mapData.tags.forEach( function ( tag ) {
					document.getElementById( "map-tags" ).innerHTML += `<div class="ui label">${tagsData[tag]}</div>`;
				} );
				document.getElementById( "map-desc" ).textContent = mapData.description;
				document.getElementById( "star-btn" ).innerHTML = `<i class="star icon"></i>${mapData.stars} stars`;
				if ( starredMaps.includes( map.code ) ) {
					document.getElementById( "star-btn" ).classList.add( "yellow" );
				}
			} );
	} );

document.getElementById( "star-btn" ).addEventListener( 'click', function ( event ) {
	if ( starredMaps.includes( map.code ) ) {
		console.log( "Map already starred. Unstarring..." );
		fetch( "/updatestars", {
			method: "POST",
			headers: {
				'Accept': 'application/json',
				'Content-Type': 'application/json'
			},
			body: JSON.stringify( { code: map.code, operation: "minus" } )
		} ).then( function ( result ) {
			document.getElementById( "star-btn" ).classList.remove( "yellow" );
			starredMaps.splice( starredMaps.indexOf( map.code ), 1 );
			map.stars--;
			document.getElementById( "star-btn" ).innerHTML = `<i class="star icon"></i>${map.stars} stars`;
			localStorage.starredMaps = JSON.stringify( starredMaps );
		} );
	} else {
		console.log( "Map not starred. Starring..." );
		fetch( "/updatestars", {
			method: "POST",
			headers: {
				'Accept': 'application/json',
				'Content-Type': 'application/json'
			},
			body: JSON.stringify( { code: map.code, operation: "add" } )
		} ).then( function ( result ) {
			document.getElementById( "star-btn" ).classList.add( "yellow" );
			starredMaps.push( map.code );
			map.stars++;
			document.getElementById( "star-btn" ).innerHTML = `<i class="star icon"></i>${map.stars} stars`;
			localStorage.starredMaps = JSON.stringify( starredMaps );
		} );
	}
} );
