<h1>Kenosha Public Library Helper</h1>
<li><i>An Amazon Alexa application that allows an owner of an Amazon Echo to inquire infromation about the Kenosha Public Library system by using voice commands. The user can inquire about information about each branch and events hosted through the library system.</i></li>
<h2>Contents</h2>
<a href="#abstract"> 1. Description</a><br>
<a href="#usage">2. Software Required for Use</a><br>
<a href="#compilation">3. Compilation</a><br>
<a href="#about">5. About</a><br>
<hr>
<h3 id="abstract">Description</h3>
This application is for use through an Amazon Echo that is hosted on Amazon Web Services. It is written in Node.js and takes advantage of Amazon's Alexa Libraries to parse spoken phrases and understand them.
<br><br>
With this application, a user can find out information about each of the library branches like their address, phone number, and times. The user may also inquire about current and upcoming events hosted by the KPL community. They can filter what is searched by when or where the event is, what age group it is aimed for, and other information about each of the events.

<hr>
<h3 id="usage">Software Required for Use</h3>
First you will need to install Node.js from this <a href="https://nodejs.org/en/download/">website</a>. Next you need to make sure that your command prompt is set up to run Node.js. You will also need the Amazon Alexa SDK which can be found at <a href="https://github.com/alexa/alexa-skills-kit-sdk-for-nodejs">this repository</a>. You will also need to install Cheerio, a library used to parse through a website and used to parse the KPL website. You can install the library by going to you command prompt and typing in the following command.

```
npm install cheerio
```
<hr>

<h3 id="compilation">Compilation</h3>
To compile and run the Code, there is several steps. First you must create an account on both <a href="https://aws.amazon.com">AWS</a> and <a href="https://developer.amazon.com">develop.Amazon</a>. On the AWS website, you must zip up all the .js files including the libraries and upload them to the website the the Lambda feature. All the other files will be used to fill out the pages on the developer console. Then you must link the AWS application to the Developer console.<br><br>
Once the actual web application is set up, You need to download the Amazon Echo app for your smart phone, and use your AWS login information to link your account. Publish the app on the developer console and it should be linked to your Amazon Echo.

<hr>
<h3 id="about">About</h3>
This application was written for the Kenosha Public Library System and is intended for public use. This project is meant to be open source and I invite anyone to download the code and expand on the project.
<br><br>
If you do decide to expand on this project, please set your annotation to here.
<br><br>
Authored by <a href="https://www.linkedin.com/in/chase-bowlin/">Chase Bowlin</a>
