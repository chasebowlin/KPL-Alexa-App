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

//this string will hold all the information needed to search the catalog for the user specified item
var searchString;


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
	const shouldEndSession = false;



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
	const shouldEndSession = false;

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
	const shouldEndSession = false;

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
	let shouldEndSession = false;

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
	const shouldEndSession = false;

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
	const shouldEndSession = false;

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
	const shouldEndSession = false;

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

//these functions allow the user to search through the online catalog to see if items are available
//========================================================================================
function StartSearch(intent, session, callback) {
	const cardTitle = intent.name;
	let searchKeyPhrase = intent.slots; //takes in what ever the key phrase / word the user is going to search
	let repromptText = '';
	let speechOutput = '';
	let sessionAttributes = {};
	const shouldEndSession = false;

	if(searchKeyPhrase) {
		speechOutput = 'jajajaj'
	}
}

//========================================================================================



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
	else if(intentName === 'StartSearch') {
		StartSearch(intent, session, callback);
	}
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