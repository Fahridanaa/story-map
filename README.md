# Story Map App

A web application that allows users to share stories with location data. Users can view stories on a map, add their own stories, and interact with the community.

**This project is a submission for the Dicoding class "Belajar Pengembangan Web Intermediate".**

## Features

-   View stories on an interactive map
-   Add stories with location data
-   User authentication (login/register)
-   Responsive design for mobile and desktop
-   Guest mode for adding stories without an account

## Technologies Used

-   HTML5
-   CSS3
-   JavaScript (ES6+)
-   Vite (Build Tool)
-   Leaflet (Maps)
-   Font Awesome (Icons)

## Getting Started

### Prerequisites

-   Node.js (v14 or higher)
-   npm or yarn

### Installation

1. Clone the repository
2. Install dependencies:
    ```
    npm install
    ```
    or
    ```
    yarn
    ```

### Development

To start the development server:

```
npm run dev
```

or

```
yarn dev
```

The application will be available at `http://localhost:5173`

### Building for Production

To build the application for production:

```
npm run build
```

or

```
yarn build
```

The built files will be in the `dist` directory.

### Preview Production Build

To preview the production build:

```
npm run preview
```

or

```
yarn preview
```

## API

The application uses the Dicoding Story API:

-   Base URL: `https://story-api.dicoding.dev/v1`
-   Endpoints:
    -   `GET /stories` - Get stories
    -   `GET /stories/{id}` - Get story detail
    -   `POST /stories` - Add story (authenticated)
    -   `POST /stories/guest` - Add story (guest)
    -   `POST /login` - Login
    -   `POST /register` - Register
