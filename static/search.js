let tags = {};
let starredMaps = [];
if ( !localStorage.starredMaps ) {
	localStorage.starredMaps = [];
} else {
	starredMaps = JSON.parse( localStorage.starredMaps );
}

fetch( "/tags" ).then( response => response.json() )
	.then( function ( tagsData ) {
		tags = tagsData;
		let tagProps = Object.keys( tagsData );
		let tagValues = Object.values( tagsData );
		for ( let i = 0; i < tagProps.length; i++ ) {
			document.getElementById( "tag-options" ).innerHTML += `<option value="${tagProps[i]}">${tagValues[i]}</option>`;
		}
		$( '.ui.dropdown' ).dropdown();
	} );

let form = document.getElementById( "search-form" );
let termsInput = document.getElementById( "terms" );
let tagsInput = document.getElementById( "tag-options" );
let dateInput = document.getElementById( "dateFilter" );
let sortInput = document.getElementById( "sort" );
let resetBtn = document.getElementById( "reset-btn" );
resetBtn.addEventListener( 'click', function ( event ) {
	form.reset();
	if ( document.getElementById( "search-results" ) ) {
		document.getElementById( "search-results" ).remove();
	}
} );

let submitBtn = document.getElementById( "submit-btn" );
submitBtn.addEventListener( 'click', function ( event ) {
	if ( document.getElementById( "search-results" ) ) {
		document.getElementById( "search-results" ).remove();
	}
	let selectedTags = Array.from( tagsInput.selectedOptions ).map( tag => tag.value ).join( '+' );
	let searchQuery = `/search?terms=${termsInput.value}&tags=${selectedTags}&dateFilter=${dateInput.value}&sort=${sortInput.value}`;
	console.log( searchQuery );
	fetch( searchQuery )
		.then( response => response.json() )
		.then( function ( mapResults ) {
			console.log( mapResults );
			let resultsBox = document.createElement( "div" );
			resultsBox.classList.add( "msg-box" );
			resultsBox.id = "search-results";
			let resultsTitle = document.createElement( "h5" );
			resultsTitle.classList.add( "search-title" );
			resultsTitle.textContent = "Search Results";
			resultsBox.appendChild( resultsTitle );
			let resultsContent = document.createElement( "div" );
			resultsContent.classList.add( "search-content" );
			resultsContent.id = "search-content";
			if ( mapResults.length > 0 ) {
				mapResults.forEach( function ( map ) {
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
						bottomContent.innerHTML += `<div class="ui label">${tags[tag]}</div>`;
					} );
					bottomContent.innerHTML += '</div>';
					bottomContent.innerHTML += `<div class="description">${map.description}</div>`;
					bottomContent.innerHTML += `<div id="star-${map.code}" class="stars meta"><i class="small yellow star icon"></i>${map.stars} stars</div>`;
					bottomContent.classList.add( "content" );
					mapDiv.appendChild( headerDiv );
					mapDiv.appendChild( imageDiv );
					mapDiv.appendChild( bottomContent );
					resultsContent.appendChild( mapDiv );
				} );
			} else {
				resultsContent.textContent = "No Results So Far!";
			}
			resultsBox.appendChild( resultsContent );
			document.body.appendChild( resultsBox );
		} );
} );
