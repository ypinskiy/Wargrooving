fetch( "/tags" ).then( response => response.json() )
	.then( function ( tagsData ) {
		let tagProps = Object.keys( tagsData );
		let tagValues = Object.values( tagsData );
		for ( let i = 0; i < tagProps.length; i++ ) {
			document.getElementById( "tag-options" ).innerHTML += `<option value="${tagProps[i]}">${tagValues[i]}</option>`;
		}
		$( '.ui.dropdown' ).dropdown();
	} );

$( "input[name=code]" ).on( {
	keydown: function ( e ) {
		if ( e.which === 32 )
			return false;
	},
	change: function () {
		this.value = this.value.replace( /\s/g, "" );
	}
} );

$( "input[name=creator]" ).on( {
	keydown: function ( e ) {
		if ( e.which === 32 )
			return false;
	},
	change: function () {
		this.value = this.value.replace( /\s/g, "" );
	}
} );

$( '.ui.form' )
	.form( {
		fields: {
			title: {
				identifier: 'title',
				rules: [
					{
						type: 'empty',
						prompt: 'Please enter a map title'
					}
				]
			},
			description: {
				identifier: 'description',
				rules: [
					{
						type: 'empty',
						prompt: 'Please enter a map description'
					}
				]
			},
			code: {
				identifier: 'code',
				rules: [
					{
						type: 'empty',
						prompt: 'Please enter a map code'
					},
					{
						type: 'exactLength[8]',
						prompt: 'Map code needs to be exactly 8 characters'
					}
				]
			},
			tags: {
				identifier: 'tags',
				rules: [
					{
						type: 'minCount[1]',
						prompt: 'Please select at least one tag'
					}
				]
			},
		}
	} );

let form = document.getElementById( "upload-form" );
let resetBtn = document.getElementById( "reset-btn" );
resetBtn.addEventListener( 'click', function ( event ) {
	form.reset();
} );
let submitBtn = document.getElementById( "submit-btn" );
submitBtn.addEventListener( 'click', function ( event ) {
	console.log( form )
	document.getElementById( "map-code" ).value = document.getElementById( "map-code" ).value.toUpperCase();
	let formData = new FormData( form );
	console.dir( Array.from( formData ) );
	if ( $( '.ui.form' ).form( 'is valid' ) ) {
		fetch( "/uploadmap", {
				method: "POST",
				body: formData
			} )
			.then( response => response.json() )
			.then( function ( response ) {
				console.log( response );
				if ( response.error ) {
					document.getElementById( "error-body" ).textContent = response.message;
					console.error( 'Error uploading:', response.message )
					form.classList.add( "error" );
					form.classList.remove( "success" );
				} else {
					document.getElementById( "success-link" ).href = `/maps/${response.code}`;
					form.classList.remove( "error" );
					form.classList.add( "success" );
				}
			} )
			.catch( error => console.error( 'Error:', error ) );
	} else {
		$( '.ui.form' ).form( 'validate form' );
	}
} );
