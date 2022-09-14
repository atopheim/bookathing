# Book-a-thing

<!-- PROJECT LOGO -->
<br />

<!-- TABLE OF CONTENTS -->
<details open="open">
  <summary>Table of Contents</summary>
  <ol>
    <li>About the Project</li>
    <li>Built with</li>
    <li>Getting started</li>
    <li>Prerequisites</li>
    <li>Project structure</li>
    <li>List of APIs</li>
    <li>Contribute</li>
  </ol>
</details>

<!-- ABOUT THE PROJECT -->

## About The Project

This is an web application made a part of a module to make appointment booking between people a lot easier. The usual process is to exchange mails between people till they find a convenient time. But this application can skip this process and book appointment by displaying available slots to users.

### Built With

This web application uses the following technology

- [ReactJS](https://reactjs.org)
- [Create React App](https://create-react-app.dev/)
- [Reactstrap](https://reactstrap.github.io/)
- [NodeJS](https://nodejs.org)
- [ExpressJS](https://expressjs.com/)
- [MomentJS](https://momentjs.com/)
- [Axios](https://www.npmjs.com/package/axios)
- [Firebase](https://firebase.google.com/)
- [Heroku](https://heroku.com)

<!-- GETTING STARTED -->

## Getting Started

1. To preview this application online click here [link](https://www.youtube.com/watch?v=dQw4w9WgXcQ&ab_channel=RickAstley)

2. To run this application locally 2. Clone the repo

3. Install yarn packages in client directory and server directory
   ```sh
   cd client
   yarn && yarn start
   cd ../server
   yarn && yarn start
   ```
4. Create a firebase firestore database with collection name `event`
5. Add your firebase service account API key in `server/serviceAccountKey.json` or as FIREBASE_ACCOUNT_KEY environment variable

### Prerequisites

You need to have the following Prerequisite to get started

- NodeJS
- Firebase Account

## Project Structure

| Folder Path         | Description                                                                           |
| ------------------- | ------------------------------------------------------------------------------------- |
| client              | This directory contains all the files needed for Client Side Rendering.               |
| client/public       | This directory contains all static content for the web app                            |
| client/src          | This directory contains all the dynamic content for the web app                       |
| client/assets       | This directory contains CSS and images required for each component of the web app     |
| client/components   | This directory contains all the components for each web page                          |
| client/timezones    | This file contains all the strings of timezone as per the latest IANA database        |
| server              | This directory contains all the files needed for server side rendering                |
| server/routes       | This directory contains all the files to routes to API Calls                          |
| server/staticConfig | This file contains all the static configuration variables used throughout the backend |

## List of APIs

| API Routes   | Parameters         | Description                                                                                                                                                                                                          |
| ------------ | ------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| /freeSlots   | Date, Timezone     | Return all the free slots available for a given date converted to whatever timezone we pass.                                                                                                                         |
| /createEvent | DateTime, Duration | All the data passed will create the event and store that into the firestore document, if the event already exists for that time you need to return status code 422 or else just store it and return with status 200. |
| /getEvents   | startDate, endDate | Return all the events between given StartDate & EndDate                                                                                                            |

