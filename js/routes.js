var routes = [
  // Index page
  {
    path: '/',
    url: './index.html',
    name: 'home',
  },
  // About page
  {
    path: '/about/',
    url: './pages/about.html',
    name: 'about',
  },
  {
    path: '/index-eng/',
    url: './pages/index-eng.html',
    name: 'about',
  },
  {
    path: '/index-fr/',
    url: './pages/index-fr.html',
    name: 'about',
  },
  // Components
  {
    path: '/mapbox-nl/',
    url: './pages/mapbox-nl.html',
  },
  {
    path: '/mapbox-eng/',
    url: './pages/mapbox-eng.html',
  },
  {
    path: '/mapbox-fr/',
    url: './pages/mapbox-fr.html',
  },
  {
    path: '/info-nl/',
    url: './pages/info-nl.html',
  },
  {
    path: '/info-eng/',
    url: './pages/info-eng.html',
  },
  {
    path: '/info-fr/',
    url: './pages/info-fr.html',
  },
  {
    path: '/Event/',
    url: './pages/event.html',
  },
  // Default route (404 page). MUST BE THE LAST
  {
    path: '(.*)',
    url: './pages/404.html',
  },
];
