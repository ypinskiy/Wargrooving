let featuredContent = document.getElementById( "featured-content" );
let featuredMaps = [];
let starredMaps = [];
if ( !localStorage.starredMaps ) {
	localStorage.starredMaps = [];
} else {
	starredMaps = JSON.parse( localStorage.starredMaps );
}

fetch( '/featuredmaps', { cache: "no-store" } ).then( function ( response ) {
		return response.json();
	} )
	.then( function ( featured ) {
		featuredMaps = featured.maps;
		BuildFeaturedMaps( featured );
	} );

function BuildFeaturedMaps( featured ) {
	featuredContent.innerHTML = "";
	featured.maps.forEach( function ( map ) {
		let mapDiv = document.createElement( "div" );
		mapDiv.classList.add( "ui", "card", "map" );
		let headerDiv = document.createElement( "div" );
		headerDiv.classList.add( "content" );
		headerDiv.innerHTML = `<div class="header"><a href="/maps/${map.code}">${map.title}</a></div>`;
		headerDiv.innerHTML += `<div class="meta"><a href="/creator/${map.creator}">By ${map.creator}</a></div>`;
		let imageDiv = document.createElement( "div" );
		imageDiv.classList.add( "image" );
		switch ( map.mimetype ) {
			case "image/png":
				imageDiv.innerHTML = `<a href="/maps/${map.code}"><img src="/assets/uploaded/${map.code}.png"></a>`;
				break;
			case "image/jpeg":
				imageDiv.innerHTML = `<a href="/maps/${map.code}"><img src="/assets/uploaded/${map.code}.jpeg"></a>`;
				break;
			case "image/gif":
				imageDiv.innerHTML = `<a href="/maps/${map.code}"><img src="/assets/uploaded/${map.code}.gif"></a>`;
				break;
		}
		let bottomContent = document.createElement( "div" );
		bottomContent.innerHTML = '<div class="meta">';
		map.tags.forEach( function ( tag ) {
			bottomContent.innerHTML += `<div class="ui label">${featured.tags[tag]}</div>`;
		} );
		bottomContent.innerHTML += '</div>';
		bottomContent.innerHTML += `<div class="description">${map.description}</div>`;
		bottomContent.classList.add( "content" );
		let buttonsDiv = document.createElement( "div" );
		buttonsDiv.classList.add( "ui", "small", "two", "bottom", "attached", "buttons" );
		buttonsDiv.innerHTML = `<div id="star-${map.code}" onclick="SubmitStar('${map.code}')" class="ui button labeled icon"><i class="star icon"></i>${map.stars} stars</div>`;
		buttonsDiv.innerHTML += `<div class="ui button red right labeled icon">Report Map<i class="user secret
 icon"></i></div>`;
		mapDiv.appendChild( headerDiv );
		mapDiv.appendChild( imageDiv );
		mapDiv.appendChild( bottomContent );
		mapDiv.appendChild( buttonsDiv );
		featuredContent.appendChild( mapDiv );
		if ( starredMaps.includes( map.code ) ) {
			document.getElementById( "star-" + map.code ).classList.add( "yellow" );
		}
	} );
}

function SubmitStar( mapCode ) {
	if ( starredMaps.includes( mapCode ) ) {
		console.log( "Map already starred. Unstarring..." );
		fetch( "/updatestars", {
			method: "POST",
			headers: {
				'Accept': 'application/json',
				'Content-Type': 'application/json'
			},
			body: JSON.stringify( { code: mapCode, operation: "minus" } )
		} ).then( function ( result ) {
			document.getElementById( "star-" + mapCode ).classList.remove( "yellow" );
			starredMaps.splice( starredMaps.indexOf( mapCode ), 1 );
			let featuredIndex = featuredMaps.findIndex( map => map.code === mapCode );
			featuredMaps[ featuredIndex ].stars--;
			document.getElementById( "star-" + mapCode ).innerHTML = `<i class="star icon"></i>${featuredMaps[featuredIndex].stars} stars`;
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
			body: JSON.stringify( { code: mapCode, operation: "add" } )
		} ).then( function ( result ) {
			document.getElementById( "star-" + mapCode ).classList.add( "yellow" );
			starredMaps.push( mapCode );
			let featuredIndex = featuredMaps.findIndex( map => map.code === mapCode );
			featuredMaps[ featuredIndex ].stars++;
			document.getElementById( "star-" + mapCode ).innerHTML = `<i class="star icon"></i>${featuredMaps[featuredIndex].stars} stars`;
			localStorage.starredMaps = JSON.stringify( starredMaps );
		} );
	}
}
