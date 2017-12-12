'use strict';

var request = require('request');
var cheerio = require('cheerio');
var Alexa = require('alexa-sdk');

//start the function to retrieve the data from the KPL websites
GetKPLData();

//the prototypes for the hours, events, and branch information
var BranchHours = function (branch, monThursHours, friHours, satHours, sunHours) {
	this._branch = branch;
	this._monThursHours = monThursHours;
	this._friHours = friHours;
	this._satHours = satHours;
	this._sunHours = sunHours;
}

var Event = function (title, month, day, time, room, branch, ageCategory) {
	this._title = title;
	this._month = month;
	this._day = day;
	this._time = time;
	this._room = room;
	this._branch = branch;
	this._ageCategory = ageCategory;
}

//these will hold all the data collected from the website
//they act like global arrays
var hoursArray = [];
var eventsArray = [];
const phoneNumber = "262-564-6100";


//This function goes to the KPL Website and grabs all the necissary data from it
//========================================================================================
function GetKPLData() {
	var baseURL = 'https://www.mykpl.info/';
	var eventExtension = 'events/upcoming';


	//----------get the hours------------
	//structure the request call
	request(baseURL, function(error, response, html) {
		//first check to make sure there are no error when making the request
		if(!error) {
			console.log(`successfully connected to the KPL website \n`);

			//next use the cheerio library on the returned html
			var $ = cheerio.load(html);


			//now that we have the cheerio object, go through
			//and find all the times for the branches
			$('.hours-display').children().each(function(index, elem) {
				var data = $(this);

				var tempHours = data.find('.address').next().text();

			//seperate out the times by day into arrays
		 	var tempMondayArray = tempHours.split("Friday: ");
		 	var tempFridayArray = tempHours.split("Friday: ").pop().split("Saturday: ");
		 	var tempSaturdayArray = tempHours.split("Saturday: ").pop().split("Sunday: ");
		 	var tempSundayArray = tempHours.split("Sunday: ").pop();

		 	//now that they are sorted out, we have to add
		 	//back in what we split off
		 	
		 	var friday = tempFridayArray[0];

		 	var saturday = tempSaturdayArray[0];

		 	var sunday = tempSundayArray;

		 	var monTursdays = tempMondayArray[0].split("Monday-Thursday: ");



		 	//now create the branch hours object and add it to the times array
		 	//check to see which branch we are on
		 	if(index === 0) {
		 		var branch = new BranchHours('southwest', monTursdays[1], friday, saturday, sunday);
		 	}
		 	else if (index === 1) {
		 		var branch = new BranchHours('northside', monTursdays[1], friday, saturday, sunday);
		 	}
		 	else if (index === 2) {
		 		var branch = new BranchHours('simmons', monTursdays[1], friday, saturday, sunday);
		 	}
		 	else if (index === 3) {
		 		var branch = new BranchHours('uptown', monTursdays[1], friday, saturday, sunday);
		 	}
		 	

		 	//now that the branch is created, add it to the array
		 	hoursArray.push(branch);
			})
		}
	})
	//----------------------

	//----------get the events------------
	//now go through and collect the data about upcoming events
	request(baseURL + eventExtension, function(error, response, html) {

		//check to make sure we correctly connected to the website + event extension
		if(!error) {

			console.log("successfully connected to the KPL EVENT website \n");

			//use cheerio library on the returned html
			var $ = cheerio.load(html);

			//go and find where the list of events start
			$('.view-content').children().each(function(index, elem) {
				var data = $(this);

				//seperate out the location of the event
				//to get the branch and room
				var location = data.find('.upcoming-event__room').text();
				var branch;
				var room;

				//console.log(location);

				if(location.indexOf('Southwest') !== -1) {
					room = location.split('Southwest ').pop();
					branch = 'southwest';
				}
				else if(location.indexOf('Northside') !== -1) {
					room = location.split('Northside ').pop();
					branch = 'northside';
				}
				else if(location.indexOf('Simmons') !== -1) {
					room = location.split('Simmons ').pop();
					branch = 'simmons';
				}
				else if(location.indexOf('Uptown') !== -1) {
					room = location.split('Uptown ').pop();
					branch = 'uptown';
				}

				//find the month and then convert it to a number
				var date = data.find('.upcoming-event__month').text();
				var dateNum;

				if ( date === "Jan") {
					dateNum = 1;
				}
				else if ( date === "Feb") {
					dateNum = 2;
				}
				else if ( date === "Mar") {
					dateNum = 3;
				}
				else if ( date === "Apr") {
					dateNum = 4;
				}
				else if ( date === "May") {
					dateNum = 5;
				}
				else if ( date === "Jun") {
					dateNum = 6;
				}
				else if ( date === "Jul") {
					dateNum = 7;
				}
				else if ( date === "Aug") {
					dateNum = 8;
				}
				else if ( date === "Sep") {
					dateNum = 9;
				}
				else if ( date === "Oct") {
					dateNum = 10;
				}
				else if ( date === "Nov") {
					dateNum = 11;
				}
				else if ( date === "Dec") {
					dateNum = 12;
				}



				var eventGrabbedTitle = data.find('.node__title').text();
				var eventTitle;

				if(eventGrabbedTitle.indexOf('(') !== -1) {
					eventTitle = eventGrabbedTitle.split('(').shift();
				}
				else {
					eventTitle = eventGrabbedTitle;
				}

				//now set the data for the new event
				var newEvent = new Event(eventTitle,
										 dateNum,
										 data.find('.upcoming-event__day').text(),
										 data.find('.upcoming-event__time-time').text(),
										 room,
										 branch,
										 data.find('.age').text().toLowerCase());

				eventsArray.push(newEvent);
			})
		}
 	})
	//----------------------

	return eventsArray;
}
//========================================================================================

//build the response for Alexa to use
//========================================================================================
function buildSpeechletResponse(title, output, repromptText, shouldEndSession) {
	return {
		outputSpeech: {
			type: 'PlainText',
			text: output,
		},
		card: {
			type: 'Simple',
			title: `SessionSpeechlet - ${title}`,
			content: `SessionSpeechlet - ${output}`,
		},
		reprompt: {
			outputSpeech: {
				type: 'PlainText',
				text: repromptText,
			},
		},
		shouldEndSession,
	};
}

function buildResponse(sessionAttributes, speechletResponse) {
	return {
		version: '1.0',
		sessionAttributes,
		response: speechletResponse,
	};
}
//========================================================================================

//these functions help control the skill's behavior
//These are the basic functions to be handled by Alexa
//========================================================================================
function getWelcomeResponse(callback) {

	const sessionAttributes = {};
	const cardTitle = 'Welcome';
	const speechOutput = 	'Welcome to the Kenosha Public Library Helper. ' +
							'This application is here to help you find out events coming up, books and other resources available at the library, and the times for the branches. ' +
							'You can try this out by saying, what are the hours for Southwest';

	/*	if the user did not hear, does not not reply to the welcome message, or says an
		incorrect response, then prompt the user to try out the features again */
	const repromptText = 'You can try saying, what are the hours for Southwest, or what events are coming up';
	const shouldEndSession = false;

	callback(sessionAttributes, buildSpeechletResponse(cardTitle, speechOutput, repromptText, shouldEndSession));

}

function handeSessionEndRequest(callback) {
	const cardTitle = 'Session Ended';
	//setting this to true ends the session + exits the skill
	const shouldEndSession = true;

	callback({}, buildSpeechletResponse(cardTitle, null, null, shouldEndSession));
}
//========================================================================================


//these functions are for the custom intents.
//========================================================================================
function GetWeeklyHours(intent, session, callback) {
	const cardTitle = intent.name;
	const branchSlot = intent.slots.Branch;
	let repromptText = '';
	let speechOutput = '';
	let sessionAttributes = {};
	const shouldEndSession = true;



	//if there is a branch that the user specified,
	//then print out the times for the branch
	if(branchSlot) {
		if (branchSlot.value === 'southwest') {
			speechOutput =  `The hours for the southwest branch are ` +
							`monday through thursday ${hoursArray[0]._monThursHours}, ` +
							`friday ${hoursArray[0]._friHours}, ` +
							`saturday ${hoursArray[0]._satHours}, ` +
							`and sunday ${hoursArray[0]._sunHours}`; 
		}
		else if (branchSlot.value === 'northside') {
			speechOutput =  `The hours for the northside branch are ` +
							`monday through thursday ${hoursArray[1]._monThursHours}, ` +
							`friday ${hoursArray[1]._friHours}, ` +
							`saturday ${hoursArray[1]._satHours}, ` +
							`and sunday it is ${hoursArray[1]._sunHours}`;

		}
		else if (branchSlot.value === 'simmons') {
			speechOutput =  `The hours for the simmons branch are ` +
							`monday through thursday ${hoursArray[2]._monThursHours}, ` +
							`friday ${hoursArray[2]._friHours}, ` +
							`saturday ${hoursArray[2]._satHours}, ` +
							`and sunday ${hoursArray[2]._sunHours}`;

		}
		else if (branchSlot.value === 'uptown') {
			speechOutput =  `The hours for the uptown branch are ` +
							`monday through thursday ${hoursArray[3]._monThursHours}, ` +
							`friday it is ${hoursArray[3]._friHours}, ` +
							`saturday ${hoursArray[3]._satHours}, ` +
							`and sunday it is ${hoursArray[3]._sunHours}`;

		}
		else {
			repromptText = 'No branch was specified, please ask for the hours for a branch.';
			console.log('no branch was inputed');
		}

	}

	callback({}, buildSpeechletResponse(cardTitle, speechOutput, repromptText, shouldEndSession));

	//if no branch was specified,
	//then reprompt the user to ask with a branch
}

//---------------------------------------------------------------------

function GetCertainHours(intent, session, callback) {
	const cardTitle = intent.name;
	let repromptText = '';
	let speechOutput = '';
	const requestedDay = intent.slots.Day;
	const branch = intent.slots.Branch;
	const shouldEndSession = true;

	if(branch && requestedDay) {
		speechOutput = "The hours for " + branch.value + " on " + requestedDay.value + " are... ";

		if(requestedDay.value === "monday" || requestedDay.value === "tuesday" || requestedDay.value === "wednesday" || requestedDay.value === "thursday") {
			if(branch.value === "southwest") {
				speechOutput += hoursArray[0]._monThursHours;
			}
			else if(branch.value === "northside") {
				speechOutput += hoursArray[1]._monThursHours;
			}
			else if(branch.value === "simmons") {
				speechOutput += hoursArray[2]._monThursHours;
			}
			else if(branch.value === "uptown") {
				speechOutput += hoursArray[3]._monThursHours;
			}
		}
		else if(requestedDay.value === "friday") {
			if(branch.value === "southwest") {
				speechOutput += hoursArray[0]._friHours;
			}
			else if(branch.value === "northside") {
				speechOutput += hoursArray[1]._friHours;
			}
			else if(branch.value === "simmons") {
				speechOutput += hoursArray[2]._friHours;
			}
			else if(branch.value === "uptown") {
				speechOutput = "uptown is closed on Fridays.";
			}
		}
		else if(requestedDay.value === "saturday") {
			if(branch.value === "southwest") {
				speechOutput += hoursArray[0]._satHours;
			}
			else if(branch.value === "northside") {
				speechOutput += hoursArray[1]._satHours;
			}
			else if(branch.value === "simmons") {
				speechOutput += hoursArray[2]._satHours;
			}
			else if(branch.value === "uptown") {
				speechOutput += hoursArray[3]._satHours;
			}
		}
		else if(requestedDay.value === "sunday") {
			if(branch.value === "southwest") {
				speechOutput += hoursArray[0]._sunHours;
			}
			else if(branch.value === "northside") {
				speechOutput += hoursArray[1]._sunHours;
			}
			else if(branch.value === "simmons") {
				speechOutput = "simmons is closed on Sundays.";
			}
			else if(branch.value === "uptown") {
				speechOutput = "uptown is closed on Sundays.";
			}
		}
	}
	else if (!branch && requestedDay) {
		repromptText = 'To get the hours for a certain day, I must know what branch you want to know the hours for. You can try saying \" what are the hours for southwest on monday \"';
	}
	else { //the user didn't say a branch or a day
		repromptText = 'I\'m sorry, but to tell you the hours I must know what branch and if there is a certain day you would like to know the hours for. you can try saysing \" what are the hours for southwest on monday \"';
	}


	callback({}, buildSpeechletResponse(cardTitle, speechOutput, repromptText, shouldEndSession));
}

//---------------------------------------------------------------------

function GetBranchAddress(intent, session, callback) {
	const cardTitle = intent.name;
	const branch = intent.slots.Branch;
	let repromptText = '';
	let speechOutput = '';
	let sessionAttributes = {};
	const shouldEndSession = true;

	//check to see if they specified a branch
	if(branch) {
		if (branch.value === 'southwest') {
			speechOutput = 'the address for southwest is ... 7979 38th avenue, Kenosha';
		}
		else if (branch.value === 'northside') {
			speechOutput = 'the address for northside is ... 1500 27th avenue, Kenosha';
		}
		else if (branch.value === 'simmons') {
			speechOutput = 'the address for simmons is ... 711 59th place, Kenosha';
		}
		else if (branch.value === 'uptown') {
			speechOutput = 'the address for uptown is ... 2419 63rd street, Kenosha';
		}
	}
	//if not then reprompt them to enter in a branch
	else {
		repromptText = 'I\'m sorry, I did not hear you specify a branch. If you would like to get the address for a branch then please say one of the four branches.';
	}

	callback({}, buildSpeechletResponse(cardTitle, speechOutput, repromptText, shouldEndSession));
}

//---------------------------------------------------------------------

function GetPhoneNumber(intent, session, callback) {
	const cardTitle = intent.name;
	const branch = intent.slots.Branch;
	let repromptText = '';
	let speechOutput = '';
	let sessionAttributes = {};
	let shouldEndSession = true;

	//check to see if they specified a branch
	if(branch.value) {
		speechOutput = 'The phone number for ' + branch.value + ' is... ' + phoneNumber;
	}
	else {
		speechOutput = 'The phone number for the kenosha public library system is... ' + phoneNumber;
	}

	callback({}, buildSpeechletResponse(cardTitle, speechOutput, repromptText, shouldEndSession));
}

//---------------------------------------------------------------------

function GetUpComingEvents(intent, session, callback) {
	const cardTitle = intent.name;
	let repromptText = 'If you would like to know more about any of the events, you can ask... what events are on... a certain date.';
	let speechOutput = '';
	let sessionAttributes = {};
	const shouldEndSession = false;


	//have alexa say the 5 upcoming events then prompt the user to ask
	//if they want to know more about one of the events
	speechOutput = 'Some upcoming events are: ';

	for(var i = 0; i < 6; i++) {
		if(speechOutput.indexOf(eventsArray[i]._title) === -1) {
			if(i === 6) {
				speechOutput += " and ";
			}
			speechOutput += eventsArray[i]._title;
			speechOutput += "... ";
		}
	}
	callback({}, buildSpeechletResponse(cardTitle, speechOutput, repromptText, shouldEndSession));
}

//---------------------------------------------------------------------

function GetEventsForDate(intent, session, callback) {
	const cardTitle = intent.name;
	const inputDate = intent.slots.Date;
	let repromptText = '';
	let speechOutput = '';
	let sessionAttributes = {};
	const shouldEndSession = true;

	var wantedDate = inputDate.value;

	//get the date for today
	var date = new Date();
	var currentYear = date.getFullYear();
	var currentD = date.getDate();
	var currentDay;
	if(currentD <= 9) {
		currentDay = "0" + currentD.toString();
	}
	else {
		currentDay = currentD.toString();
	}
	var currentM = (date.getMonth() + 1);
	var currentMonth;
	if(currentM <= 9) {
		currentMonth = "0" + currentM.toString();
	}
	else {
		currentMonth = currentM.toString();
	}


	var currentDate = currentYear + "-" + currentMonth + "-" + currentDay;

	//seperate out the passed in date
	var passedDate = wantedDate.split('-');
	console.log(passedDate);
	console.log("\n\n\n" + currentDate + "\n\n\n");


	//if the user wants events for the current day
	if(wantedDate === currentDate) {

		speechOutput = "the events for today are... ";

		//go through the array of dates and find events for today
		for(var i = 0; i < (eventsArray.length / 2); i++) {

			//if we do find events for today, then add them to the speechlet response
			if (eventsArray[i]._day.toString() === currentDay.toString() && eventsArray[i]._month.toString() === currentMonth.toString()) {
				if(speechOutput.indexOf(eventsArray[i]._title) === -1) {
					speechOutput += eventsArray[i]._title;
					speechOutput += "...";
				}
			}	
		}
		//if there were no event found for today
		if (speechOutput === 'the events for today are... ') {
			speechOutput = "there were no events found for Today.";
		}
	}

	//if the user wants events for tomorrow
	else if((passedDate[1].toString() === currentMonth.toString() && passedDate[2].toString() === (currentDay + 1).toString()) ||
			(passedDate[1].toString() === (currentMonth + 1).toString() && passedDate[2].toString() === "01")) {

		speechOutput = "the events for tomorrow are... ";

		//go through and find the events for tomorrow
		for(var i = 0; i < eventsArray.length; i++) {

			//add a zero to the front of the number if it is less than or equal to 9
			//this will alllow for data checking
			var eventDay;
			if(eventsArray[i]._day <= 9) {
				eventDay = "0" + eventsArray[i]._day.toString();
			}
			else {
				eventDay =  eventsArray[i]._day.toString();
			}


			if(eventDay === passedDate[2].toString() && eventsArray[i]._month.toString() === passedDate[1].toString()) {
				if(speechOutput.indexOf(eventsArray[i]._title) === -1) {
					speechOutput += eventsArray[i]._title;
					speechOutput += "... ...";
				}
			}
		}
		if (speechOutput === "the events for tomorrow are... ") {
			speechOutput = "there are no events for tomorrow.";
		}
	}

	//if the user wants a date in the future
	else if((parseInt(passedDate[1].toString()) >= parseInt(currentMonth)) ||
			(parseInt(passedDate[0].toString()) > parseInt(currentYear.toString()) && passedDate[1].toString() === "01")) {
		
		speechOutput = "The events for " + passedDate[1] + " " + passedDate[2] + " are...";


		for(var i = 0; i < eventsArray.length; i++) {

			var eventDay;
			if(eventsArray[i]._day <= 9) {
				eventDay = "0" + eventsArray[i]._day.toString();
			}
			else {
				eventDay =  eventsArray[i]._day.toString();
			}


			if(eventDay === passedDate[2].toString() && eventsArray[i]._month.toString() === passedDate[1].toString()) {
				if(speechOutput.indexOf(eventsArray[i]._title) === -1) {
					speechOutput += eventsArray[i]._title;
					speechOutput += "... ...";
				}
			}
		}
		if (speechOutput === ("The events for " + passedDate[1] + " " + passedDate[2] + " are...")) {
			speechOutput = "there are no events found for that date. please try another date.";
		}

	}
	callback({}, buildSpeechletResponse(cardTitle, speechOutput, repromptText, shouldEndSession));
}


//---------------------------------------------------------------------


function GetEventForBranch (intent, session, callback) {
	const cardTitle = intent.name;
	const branchSlot = intent.slots.Branch;
	let repromptText = '';
	let speechOutput = '';
	let sessionAttributes = {};
	const shouldEndSession = true;

	//if the user did define a branch to search for
	if(branchSlot) {
		speechOutput = "the upcoming events at " + branchSlot.value + " are: ";

		//go through the array and find all events that are at the specified branch
		for(var i = 0; i < eventsArray.length; i++) {
			if(branchSlot.value === eventsArray[i]._branch) {
				speechOutput += eventsArray[i]._title;
				speechOutput += "...";
			}
		}
		if( speechOutput === "the upcoming events at " + branchSlot.value + " are: ") {
			speechOutput = "there are no upcoming events found for branch. Please try another branch.";
		}
	}
	else {
		repromptText = "No branch was specified, please ask for the events for one of the branches.";
		console.log("no branch was inputed");
	}

	callback({}, buildSpeechletResponse(cardTitle, speechOutput, repromptText, shouldEndSession));
}


//---------------------------------------------------------------------


function GetEventsForAgeGroup (intent, session, callback) {
	const cardTitle = intent.name;
	const ageGroup = intent.slots.AgeGroup;
	let repromptText = '';
	let speechOutput = '';
	let sessionAttributes = {};
	const shouldEndSession = true;

	//if the user did define an age group to search for
	if(ageGroup) {
		speechOutput = "some " + ageGroup.value +" events coming up are: ";

		//go through the array and find all events that match the specific age group
		for(var i = 0; i < eventsArray.length; i++) {
			console.log(ageGroup.value + "......" + eventsArray[i]._ageCategory + "\n\n");
			if(ageGroup.value === eventsArray[i]._ageCategory) {
				speechOutput += eventsArray[i]._title;
				speechOutput += "...";
			}
		}
		if (speechOutput === "some " + ageGroup.value +" events coming up are: ") {
			speechOutput = "there are no upcoming events for the specified age group. Please try a different age group.";
		}

	}
	else {
		repromptText = "No age group was specified, please ask for the events for one of the age groups like toddler or adult.";
		console.log("no age group specified");
	}

	callback({}, buildSpeechletResponse(cardTitle, speechOutput, repromptText, shouldEndSession));
}

//========================================================================================

/*
	maybe someday this code will be able to be used. for the time being, this part of the app is a 
	webscraper that searches the online catalog for what ever the user specified

	the problem is that when the application trys to interact with the catalog website, the connection
	is not accepted well and the website returns an error.

	How this webscraper was working was by creating a custom URL that has specific parts that are used
	narrow and search for items in the catalog. I studied how the website constructed this and made sure
	that they were all constructed the right way, but it has failed. 
	
//these functions allow the user to search through the online catalog to see if items are available
//========================================================================================
function StartSearch(intent, session, callback) {
	const cardTitle = intent.name;
	let searchSlot = intent.slots; //takes in what ever the key phrase / word the user is going to search
	let repromptText = '';
	let speechOutput = '';
	let sessionAttributes = {};
	const shouldEndSession = false;

	var searchKeyPhrase
	//check to make sure that the user entered in one of the many different slot types the user can use to search
	//if they did then save its value
	if (searchSlot.Animal.value) {
		searchKeyPhrase = searchSlot.Animal;
	}
	else if (searchSlot.Athlete.value) {
		searchKeyPhrase = searchSlot.Athlete;
	}
	else if (searchSlot.Author.value) {
		searchKeyPhrase = searchSlot.Author;
	}
	else if (searchSlot.Book.value) {
		searchKeyPhrase = searchSlot.Book;
	}
	else if (searchSlot.City) {
		searchKeyPhrase = searchSlot.City;
	}
	else if (searchSlot.Comic.value) {
		searchKeyPhrase = searchSlot.Comic;
	}
	else if (searchSlot.Country.value) {
		searchKeyPhrase = searchSlot.Country;
	}
	else if (searchSlot.Festival.value) {
		searchKeyPhrase = searchSlot.Festival;
	}
	else if (searchSlot.FictionalCharacter.value) {
		searchKeyPhrase = searchSlot.FictionalCharacter;
	}
	else if (searchSlot.Game.value) {
		searchKeyPhrase = searchSlot.Game;
	}
	else if (searchSlot.Genre.value) {
		searchKeyPhrase = searchSlot.Genre;
	}
	else if (searchSlot.Landform.value) {
		searchKeyPhrase = searchSlot.Landform;
	}
	else if (searchSlot.Movie.value) {
		searchKeyPhrase = searchSlot.Movie;
	}
	else if (searchSlot.MusicAlbum.value) {
		searchKeyPhrase = searchSlot.MusicAlbum;
	}
	else if (searchSlot.MusicGroup.value) {
		searchKeyPhrase = searchSlot.MusicGroup;
	}
	else if (searchSlot.MusicRecording.value) {
		searchKeyPhrase = searchSlot.MusicRecording;
	}
	else if (searchSlot.Game.value) {
		searchKeyPhrase = searchSlot.Game;
	}
	else if (searchSlot.Musician.value) {
		searchKeyPhrase = searchSlot.Musician;
	}
	else if (searchSlot.Organization.value) {
		searchKeyPhrase = searchSlot.Organization;
	}
	else if (searchSlot.Person.value) {
		searchKeyPhrase = searchSlot.Person;
	}
	else if (searchSlot.Sport.value) {
		searchKeyPhrase = searchSlot.Sport;
	}
	else if (searchSlot.SportsEvent.value) {
		searchKeyPhrase = searchSlot.SportsEvent;
	}
	else if (searchSlot.SportsTeam.value) {
		searchKeyPhrase = searchSlot.SportsTeam;
	}
	
	//if no user data was inputed, then reprompt them to give alexa something to search
	else {
		speechOutput = 'Please say a title, subject, or author that you would like to search for.';
	}

	//check to make sure that the user did enter in a valid value
	if(typeof searchKeyPhrase.value !== 'undefined') {
		//seperate out what the user wants to search and then add + inbetween the words
		searchKeyPhrase = searchKeyPhrase.value;
		searchKeyPhrase = searchKeyPhrase.replace(/ /g, "+");

		//this string will hold all the information needed to search the catalog for the user specified item
		var searchString = "ent.sharelibraries.info/client/en_US/kpl/search/results";
		var titleURL;
		var formatURL = sessionAttributes.formatURL;
		var categoryURL = sessionAttributes.categoryURL;
		var languageURL = sessionAttributes.languageURL;

		//now add on the users information that was passed in to the search string + the nessisary URL info
		titleURL = "?qu=";
		titleURL += searchKeyPhrase;

		//add the search string to be stored in the session attributes so that it can be passed to other functions
		sessionAttributes = {"baseURL": searchString, "titleURL": titleURL, "formatURL": formatURL, "categoryURL": categoryURL, "languageURL": languageURL};


		//have alexa prompt the user to input a format type
		speechOutput = 'what type of format are you looking for?';
		repromptText = 'I\'m sorry, but I did not hear a format type. Please enter in a format type. A response could be... a book, eVideo, large print, or any others offered by the library.';
	}
	else {
		speechOutput = 'I\'m sorry, but that did not seem to be a valid search topic. Please try a different subject you would like to search for.';
	}

	
	callback(sessionAttributes, buildSpeechletResponse(cardTitle, speechOutput, repromptText, shouldEndSession));
}

//---------------------------------------------------------------------

function GetFormatType(intent, session, callback) {
	const cardTitle = intent.name;
	let formatSlot = intent.slots.Format; 
	let repromptText = '';
	let speechOutput = '';
	let sessionAttributes = session.attributes;
	const shouldEndSession = false;

	//check to make sure that the user entered in a correct format
	if(formatSlot.value) {
		//replace the spaces with +
		var format = formatSlot.value.replace(/ /g, "+");


		//grab the search string from the session attributes
		//decalare the new formatURL
		var baseURL = sessionAttributes.baseURL;
		var titleURL = sessionAttributes.titleURL;
		var formatURL = "&pf=FORMAT%09Format%09";
		var categoryURL = sessionAttributes.categoryURL;
		var languageURL = sessionAttributes.languageURL;


		//check what kind of format it is
		//depending on what kind is how the URL is shaped
		if(format === "book") {
			formatURL  += "BOOK%09Books";
		}
		else if (format === "music+sound+recording") {
			formatURL  += "MUSICSNDREC%09";
			formatURL += format;
		}
		else if (format === "eBook") {
			formatURL += "E_BOOK%09";
			formatURL += format;
		}
		else if (format === "eAudiobook") {
			formatURL += "E_SOUNDREC%09";
			formatURL += format;
		}
		else if (format === "audio+disk") {
			formatURL += "SOUNDDISC%09";
			formatURL += format;
		}
		else if (format === "video+disk") {
			formatURL += "VIDEODISK%09";
			formatURL += format;
		}
		else if (format === "eVideo") {
			formatURL += "E_VIDEO%09";
			formatURL += format;
		}
		else if (format === "large+print") {
			formatURL += "LARGEPRINT%09";
			formatURL += format;
		}
		else if (format === "music") {
			formatURL += "MUSIC%09";
			formatURL += format;
		}
		else if (format === "regular+print") {
			formatURL += "REGULARPRINT%09";
			formatURL += format;
		}

		//update the session attributes
		sessionAttributes = {"baseURL": baseURL, "titleURL": titleURL, "formatURL": formatURL, "categoryURL": categoryURL, "languageURL": languageURL, "format": format};


		//if the format entered is a book
		if(format === "book" || format === "large+print" || format === "regular+print") {
			speechOutput = 'Is the work fiction or non fiction?';
			repromptText = 'I\'m sorry, but I did not hear the type piece of literature it is. Please say fiction or nonfiction.';
		}
		else {
			speechOutput = 'is this in a certain language. If not then just say search';
			repromptText = 'I\'m sorry, but I did not hear the language the item is in. Please specify a language. If it does not matter the language then say no.';
		}
	}
	//if they didn't enter in a correct format type, then prompt the
	//user to try again
	else {
		speechOutput = 'I\'m sorry, but I didn\'t hear the type of format you are searching for. Please say the format that you want to search for.';
		repromptText = 'I\'m sorry, but I didn\'t hear the type of format you are searching for. Please say the format that you want to search for. A response could be... a book, eVideo, large print, or any others offered by the library.';
	}


	callback(sessionAttributes, buildSpeechletResponse(cardTitle, speechOutput, repromptText, shouldEndSession));
}

//---------------------------------------------------------------------

function GetItemCategory(intent, session, callback) {
	const cardTitle = intent.name;
	let category = intent.slots.ItemCategory; 
	let repromptText = '';
	let speechOutput = '';
	let sessionAttributes = session.attributes;
	const shouldEndSession = false;


	//check to make sure that the user entered in fiction or nonfiction and that
	//the format type they are looking for is either book, large print, or regular print
	if(sessionAttributes.format === "book" || sessionAttributes.format === "large+print" || sessionAttributes.format === "regular+print") {
		
		//grab the data from the session attributes and
		//define the CategoryURL
		var baseURL = sessionAttributes.baseURL;
		var titleURL = sessionAttributes.titleURL;
		var formatURL = sessionAttributes.formatURL;
		var categoryURL = "&qf=ITEMCAT1%09Item+Category+1%091%3A";
		var languageURL = sessionAttributes.languageURL;


		if(category.value === "fiction") {
			categoryURL += "FICTION%09";
			categoryURL += category.value;

		}
		else if(category.value === "nonfiction") {
			categoryURL += "NONFICTION%09";
			categoryURL += category.value;
		}

		//update the session attributes
		sessionAttributes = {"baseURL": baseURL, "titleURL": titleURL, "formatURL": formatURL, "categoryURL": categoryURL, "languageURL": languageURL};

		
		speechOutput = 'is this in a certain language. If not then just say search';
		repromptText = 'I\'m sorry, but I did not hear a response. Please say a language or say search if you want me to begin the search.';
	}
	else {
		speechOutput = 'I\'m sorry, but that only works with books, large prints, and regular prints. You can give me a language or the type of format to use in the search or you can just say search.';
		repromptText = 'I\'m sorry, I didn\'t hear what you said.';
	}

	callback(sessionAttributes, buildSpeechletResponse(cardTitle, speechOutput, repromptText, shouldEndSession));
}

//---------------------------------------------------------------------

function GetLanguage(intent, session, callback) {
	const cardTitle = intent.name;
	let language = intent.slots.Language; 
	let repromptText = '';
	let speechOutput = '';
	let sessionAttributes = session.attributes;
	const shouldEndSession = false;


	//check to see if they have entered in a language
	if(language.value) {
		//grab the data from the session attributes and
		//define the CategoryURL
		var baseURL = sessionAttributes.baseURL;
		var titleURL = sessionAttributes.titleURL;
		var formatURL = sessionAttributes.formatURL;
		var categoryURL = sessionAttributes.categoryURL;
		var languageURL = "&qf=LANGUAGE%09Language%09";
			languageURL += language.value;
		
		if(language.value === "English") {
			languageURL += "ENG%09"
			languageURL += language.value;
		}
		else if(language.value === "Spanish") {
			languageURL += "SPA%09"
			languageURL += language.value;
		}
		else if(language.value === "Chinese") {
			languageURL += "CHI%09"
			languageURL += language.value;
		}

		//update the session attributes
		sessionAttributes = {"baseURL": baseURL, "titleURL": titleURL, "formatURL": formatURL, "categoryURL": categoryURL, "languageURL": languageURL};
	
		speechOutput = 'If that is all the information you want to use to search, just say search or you can change certain parts of your search.';
	}
	else {
		speechOutput = 'I\'m sorry, but that was not a valid language to search for. I understand, english, spanish, or you can begin the search by saying search.';
		repromptText = 'I\'m sorry, I didn\'t hear you say anything.';
	}

	callback(sessionAttributes, buildSpeechletResponse(cardTitle, speechOutput, repromptText, shouldEndSession));
}


//---------------------------------------------------------------------

//this function takes in two different items: a title and one of the other helpful search parts
function startSearchTwoItems(intent, session, callback) {
	const cardTitle = intent.name;
	let searchSlot = intent.slots; 
	let repromptText = '';
	let speechOutput = '';
	let sessionAttributes = session.attributes;
	const shouldEndSession = false;

	//this string will hold all the information needed to search the catalog for the user specified item
	var baseURL = "ent.sharelibraries.info/client/en_US/kpl/search/results";

	//get the title first
	var searchKeyPhrase
	//check to make sure that the user entered in one of the many different slot types the user can use to search
	//if they did then save its value
	if (searchSlot.Animal.value) {
		searchKeyPhrase = searchSlot.Animal;
	}
	else if (searchSlot.Athlete.value) {
		searchKeyPhrase = searchSlot.Athlete;
	}
	else if (searchSlot.Author.value) {
		searchKeyPhrase = searchSlot.Author;
	}
	else if (searchSlot.Book.value) {
		searchKeyPhrase = searchSlot.Book;
	}
	else if (searchSlot.City) {
		searchKeyPhrase = searchSlot.City;
	}
	else if (searchSlot.Comic.value) {
		searchKeyPhrase = searchSlot.Comic;
	}
	else if (searchSlot.Country.value) {
		searchKeyPhrase = searchSlot.Country;
	}
	else if (searchSlot.Festival.value) {
		searchKeyPhrase = searchSlot.Festival;
	}
	else if (searchSlot.FictionalCharacter.value) {
		searchKeyPhrase = searchSlot.FictionalCharacter;
	}
	else if (searchSlot.Game.value) {
		searchKeyPhrase = searchSlot.Game;
	}
	else if (searchSlot.Genre.value) {
		searchKeyPhrase = searchSlot.Genre;
	}
	else if (searchSlot.Landform.value) {
		searchKeyPhrase = searchSlot.Landform;
	}
	else if (searchSlot.Movie.value) {
		searchKeyPhrase = searchSlot.Movie;
	}
	else if (searchSlot.MusicAlbum.value) {
		searchKeyPhrase = searchSlot.MusicAlbum;
	}
	else if (searchSlot.MusicGroup.value) {
		searchKeyPhrase = searchSlot.MusicGroup;
	}
	else if (searchSlot.MusicRecording.value) {
		searchKeyPhrase = searchSlot.MusicRecording;
	}
	else if (searchSlot.Game.value) {
		searchKeyPhrase = searchSlot.Game;
	}
	else if (searchSlot.Musician.value) {
		searchKeyPhrase = searchSlot.Musician;
	}
	else if (searchSlot.Organization.value) {
		searchKeyPhrase = searchSlot.Organization;
	}
	else if (searchSlot.Person.value) {
		searchKeyPhrase = searchSlot.Person;
	}
	else if (searchSlot.Sport.value) {
		searchKeyPhrase = searchSlot.Sport;
	}
	else if (searchSlot.SportsEvent.value) {
		searchKeyPhrase = searchSlot.SportsEvent;
	}
	else if (searchSlot.SportsTeam.value) {
		searchKeyPhrase = searchSlot.SportsTeam;
	}
	
	//if no user data was inputed, then reprompt them to give alexa something to search
	else {
		speechOutput = 'Please say a title, subject, or author that you would like to search for.';
	}

	//check to make sure that the user did enter in a valid value
	if(typeof searchKeyPhrase.value !== 'undefined') {
		//seperate out what the user wants to search and then add + inbetween the words
		searchKeyPhrase = searchKeyPhrase.value;
		searchKeyPhrase = searchKeyPhrase.replace(/ /g, "+");


		//now add on the users information that was passed in to the search string + the nessisary URL info
		var titleURL = "?qu=";
		titleURL += searchKeyPhrase;
	}
	//FINISH FIXING THIS TO WORK WITH BOOKS SPEECHLET 0UTPUT AND MAKE SURE THAT ALL FORMATS ARE FIXED TO BE SOMETHING+SOMETHING

	var secondSearchPhrase
	var secondURL
	//grab the second item
	if (searchSlot.Format) {
		//SET UP THE URLS FOR THE SPECIFIC SECOND SEARCH PHARSE
		secondSearchPhrase = searchSlot.Format.value;

		secondURL = "&pf=FORMAT%09Format%09";

		//check what kind of format it is
		//depending on what kind is how the URL is shaped
		if(secondSearchPhrase === "book") {
			secondURL  += "BOOK%09Books";
		}
		else if (secondSearchPhrase === "music+Sound+recording") {
			secondURL  += "MUSICSNDREC%09";
			secondURL += secondSearchPhrase;
		}
		else if (secondSearchPhrase === "eBook") {
			secondURL += "E_BOOK%09";
			secondURL += secondSearchPhrase;
		}
		else if (secondSearchPhrase === "eAudiobook") {
			secondURL += "E_SOUNDREC%09";
			secondURL += secondSearchPhrase;
		}
		else if (secondSearchPhrase === "audio+disk") {
			secondURL += "SOUNDDISC%09";
			secondURL += secondSearchPhrase;
		}
		else if (secondSearchPhrase === "video+disk") {
			secondURL += "VIDEODISK%09";
			secondURL += secondSearchPhrase;
		}
		else if (secondSearchPhrase === "eVideo") {
			secondURL += "E_VIDEO%09";
			secondURL += secondSearchPhrase;
		}
		else if (secondSearchPhrase === "large+print") {
			secondURL += "LARGEPRINT%09";
			secondURL += secondSearchPhrase;
		}
		else if (secondSearchPhrase === "music") {
			secondURL += "MUSIC%09";
			secondURL += secondSearchPhrase;
		}
		else if (secondSearchPhrase === "regular+print") {
			secondURL += "REGULARPRINT%09";
			secondURL += secondSearchPhrase;
		}
	
		sessionAttributes = {"baseURL": baseURL, "titleURL": titleURL, "formatURL": secondURL};
	}

	
	
	speechOutput = 'Is there any more details you can give me to help me search for that item? If not then just say search.';
	repromptText = 'I\'m sorry, but I did not hear what you said.'


	callback(sessionAttributes, buildSpeechletResponse(cardTitle, speechOutput, repromptText, shouldEndSession));
}

//---------------------------------------------------------------------

function searchCatalog(intent, session, callback) {
	const cardTitle = intent.name;
	let slots = '';
	let repromptText = '';
	let speechOutput = '';
	let sessionAttributes = session.attributes;
	const shouldEndSession = true;


	//first grab all of the session attributes and combine them to make
	//the URL that will be used to search for the item
	var https = "https://"
	var baseURL = sessionAttributes.baseURL;
	var titleURL = sessionAttributes.titleURL;
	var formatURL = sessionAttributes.formatURL;
	var categoryURL = sessionAttributes.categoryURL;
	var languageURL = sessionAttributes.languageURL;

	var catalogURL = https;

	//check to make sure that each of the urls are defined
	//if they are then add them to the string
	if(typeof baseURL !== 'undefined') {
		catalogURL += baseURL;
		//the base URL must be set up for the function to work
		//the rest are optional

		//these variables will hold the user entered data
		var title = "";
		var format = "";
		var category = "";
		var language = "";

		if(typeof titleURL !== 'undefined') {
			catalogURL += titleURL;
			title = titleURL.split("u=").pop();
			title = title.replace('+', ' ');
		}
		if(typeof formatURL !== 'undefined') {
			catalogURL += formatURL;
			format = formatURL.split("%09").pop();
			format = format.replace('+', ' ');
		}
		if(typeof categoryURL !== 'undefined') {
			catalogURL += categoryURL;
			category = catalogURL.split("%09").pop();
		}
		if(typeof languageURL !== 'undefined') {
			catalogURL += languageURL;
			language = languageURL.split("e%09").pop();
		}
	}
	
	console.log(catalogURL);

	if(format === "Book" || format === "music Sound recording" || format === "audio disk" ||
	   format === "video disk" || format === "large print" || format === "music" || format === "regularprint") {
		catalogURL += "?av=0";
	}

	console.log('\n\n\n' + catalogURL + '\n\n\n');

	var testURL = "https://ent.sharelibraries.info/client/en_US/kpl/search/results?qu=harry+potter";


	request(testURL, function(error, response, html) {

		setTimeout(function() {
			//check to make sure there were no errors when connecting to the catalog
			if(!error) {
				console.log('\n\nsuccessfully connected to the CATALOG\n\n');

				//next use the cheerio library on the returned html
				var $ = cheerio.load(html);
				console.log('made it passed load html\n');
				var test =  $('body').html();//.find('#detailLink0').attr('href');
				console.log('assigned the variable test = bodys html\n');
				console.log('test should display here: ' + test);

				//now that we have the cheerio object, go through
				//and find if there is an item available by the specified search params
				$('.results_wrapper').children().each(function(index, elem) {
					var every_four = $(this);

					console.log("penis");


					every_four.children().first().children().each(function(index, elem) {
						var data = this;

						console.log("data.find('results_cell0').text()");
					})

				})
			}
			else if(error) {
				console.log('\n\n\n' + error + '\n\n\n');
			}
		}, 5000);
	});

	callback(sessionAttributes, buildSpeechletResponse(cardTitle, speechOutput, repromptText, shouldEndSession));
}
//========================================================================================
*/


//the events

//========================================================================================
//this is called when the session starts
function onSessionStarted(SessionStartedRequest, session) {
	console.log(`onSessionStarted request_id=${SessionStartedRequest.requestId}, ............... session_id=${session.sessionId}`);
}

//called when the user launches the skill without specifying what they want
function onLaunch(LaunchRequest, session, callback) {
	console.log(`onLaunch request_id=${LaunchRequest.requestId},  ............... session_id=${session.sessionId}`);

	//dispatch to the welcome skill's launch
	getWelcomeResponse(callback);
}


//gets called when the user actually specifies an intent for the skill
function onIntent(intentRequest, session, callback) {

	const intent = intentRequest.intent;
	const intentName = intentRequest.intent.name;

	//check to make sure the intent is a valid intent
	//if it is go to the correct skill's launch
	if(intentName === 'AMAZON.HelpIntent') {
		getWelcomeResponse(callback);
	}
	else if(intentName === 'AMAZON.CancelIntent') {
		handeSessionEndRequest(callback);
	}
	else if(intentName === 'GetWeeklyHours') {
		GetWeeklyHours(intent, session, callback);
	}
	else if(intentName === 'GetCertainHours') {
		GetCertainHours(intent, session, callback);
	}
	else if(intentName === 'GetBranchAddress') {
		GetBranchAddress(intent, session, callback);
	}
	else if(intentName === 'GetPhoneNumber') {
		GetPhoneNumber(intent, session, callback);
	}
	else if(intentName === 'GetUpcomingEvents') {
		GetUpComingEvents(intent, session, callback);
	}
	else if(intentName === 'GetEventsForDate') {
		GetEventsForDate(intent, session, callback);
	}
	else if(intentName === 'GetEventsForBranch') {
		GetEventForBranch(intent, session, callback);
	}
	else if(intentName === 'GetEventsForAgeGroup') {
		GetEventsForAgeGroup(intent, session, callback);
	}
	/*
	else if(intentName === 'StartSearch') {
		StartSearch(intent, session, callback);
	}
	else if(intentName === 'GetFormatType') {
		GetFormatType(intent, session, callback);
	}
	else if(intentName === 'GetItemCategory') {
		GetItemCategory(intent, session, callback);
	}
	else if(intentName === 'GetLanguage') {
		GetLanguage(intent, session, callback);
	}
	else if(intentName === 'startSearchTwoItems') {
		startSearchTwoItems(intent, session, callback);
	}
	else if(intentName === 'searchCatalog') {
		searchCatalog(intent, session, callback)
	}
	*/
	else {
		throw new Error('Invalid intent');
	}

}
//========================================================================================







//what is called when the user starts the skill
//acts like the main function
//========================================================================================
exports.handler = (event, context, callback) => {
   try {
	   	setTimeout(function() {
		   	//if this is a new session
		   	if (event.session.new) {
		   		onSessionStarted({requestId: event.request.requestId}, event.session);
		   	}

		   	if (event.request.type === "LaunchRequest") {
		   		onLaunch(event.request,
		   				 event.session,
		   				 function callback(sessionAttributes, speechletResponse) {
		   				 	context.succeed(buildResponse(sessionAttributes, speechletResponse));
		   				 });
		   	}
		   	else if (event.request.type === 'IntentRequest') {
		   		onIntent(event.request,
		   				 event.session,
		   				 (sessionAttributes, speechletResponse) => {
		   				 	callback(null, buildResponse(sessionAttributes, speechletResponse));
		   				 });
	   	}
   	},1300);
  


   }
   catch (err) {
   	callback(err);
   }
};
//========================================================================================