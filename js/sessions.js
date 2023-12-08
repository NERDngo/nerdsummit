// Call to function with anonymous callback
loadJSON(function (response) {
	const rows = massageData(JSON.parse(response).values);
	//console.log(rows); // this is an array of all the sessions 
	const day1 = rows.filter((row) => row.day === "1");
	const day2 = rows.filter((row) => row.day === "2");
	createSessionList("Day-1", day1);
	createSessionList("Day-2", day2);

	var hash = window.location.hash;  // has = #schedule for example for nerdsummit.org/#schedule 
	
	// START added 2023-12
	//console.log(hash); // This will output '#schedule'
	var cleanedHashtag = hash.replace('#', '');
	// console.log(cleanedHashtag); // This will output 'schedule' 

	// need to find the ogimage value from rows where id = cleanedHashtag
	let ogimageUrl = 'https://nerdsummit.org/images_sesssions/default.png'
	let result = rows.find(item => item.id === cleanedHashtag);
	if (result) {
		//console.log("Value of ogimage = ", result.ogimage);
		ogimageUrl = 'https://nerdsummit.org/images_sesssions/' + result.ogimage ;
	} else {
		//console.log("No object found with id = ", cleanedHashtag);
	}
	// OK now use result.ogimage to change the meta tag
	if (result) {
		var metaTagOG = document.querySelector('meta[property="og:image"]');
		var metaTagTwitter = document.querySelector('meta[name="twitter:image"]');
		// Check if the meta tag exists
		if (metaTagOG) {
			// Change the content attribute of the meta tag
			metaTagOG.setAttribute('content', ogimageUrl);
		}
		if (metaTagTwitter) {
			// Change the content attribute of the meta tag
			metaTagTwitter.setAttribute('content', ogimageUrl);
		}
	}
	// END added 2023-12
	
	if (hash) {
		var $session = $(hash);
		if (!$session.length) {
			return;
		}
		$session.click();
		$("html, body").animate(
			{
				scrollTop: $session.offset().top - 120, //Minus header + shadow
			},
			300
		);
	}

});

// see https://stackoverflow.com/a/34908037/5855010  (original link for how to do this)
function loadJSON(callback) {
	var xobj = new XMLHttpRequest();
	xobj.overrideMimeType("application/json");
	// this seems to work but is in a different format so parsing needs to change
	// xobj.open("GET", "/data/sessions.json", true);
	// TESTING BELOW 
	xobj.open("GET", "/data/sessions.json", true);  
	// this does not work, look into it:
	// xobj.open("GET", "https://sheets.googleapis.com/v4/spreadsheets/1gZp8P33sPg8h6iOczKEa4HrFENHkeDFZUmZRNo1qt-k/values/CURRENT!A1:P1022?key=${{ secrets.GOOGLE_SHEETS_API_KEY }", true);
	// 2022 NOTES
	// shifting to locally saved file ( that json file above is save locally in the data folder )
	// see notes from Rick on how to do this 
	xobj.onreadystatechange = function () {
		if (xobj.readyState == 4 && xobj.status == "200") {
			// .open will NOT return a value but simply returns undefined in async mode so use a callback
			callback(xobj.responseText);
		}
	};
	xobj.send(null);
}

function massageData(array) {
	const keys = array[0];
	const rawRows = array.slice(1, array.length);

	const rows = rawRows.map(valuesToObject);
	function valuesToObject(rawRow) {
		return keys.reduce(
			(acc, key, index) => ((acc[key] = rawRow[index]), acc),
			{}
		);
	}

	return rows;
}

function createSessionList(dayId, sessions) {
	const dayElement = document.querySelector(`#${dayId}`);
	if (!dayElement) {
		return;
	}
	sessions.forEach((session) => {
		let sessionElement = document.createElement("div");
		sessionElement.className = `session #${session.start}`;
		sessionElement.innerHTML = sessionTemplate(session);

		dayElement.appendChild(sessionElement);
	});

	function sessionTemplate(session) {
		const speakerLink = session.speakerLink
			? `<a href="${session.speakerLink}" class="speaker-link">Link to speaker info</a>`
			: null;
		const slideLink = session.slideLink
			? `<a href="${session.slideLink}" class="slides-link">Link to slides</a>`
			: null;
		const seperator =
			session.slideLink && session.speakerLink ? `<span> | </span>` : null;
		return sanitize`
        <div class="top" id="${session.id}">
            <div class="top-content">
                <div class="title"><h4 class="name">${session.name}</h4></div>
                <p class="speaker">${session.speaker}</p>
                <div class="time"> ${session.start} - ${session.end} </div>
                <div class="room">${session.room} </div>
                <div class="tags">${session.type} </div>
            </div>
            <div class="top-control">
                <a href="#${session.id}" onClick="function(e) {e.preventDefault(); return false;}"><span class="plus">+</span><span class="minus hide">-</span></a>
            </div>
        </div>
        <div class="info">
            ${speakerLink}
            ${seperator}
            ${slideLink}
            <p>${session.description}</p>
        </div>
        `;
	}

	function sanitize(strings, ...values) {
		const dirty = strings.reduce((prev, next, i) => {
			return `${prev}${next}${DOMPurify.sanitize(values[i])}`;
		}, "");
		return dirty;
	}
}
