var routes = [
  // Index page
  {
    path: '/',
    url: './index.html',
    name: 'home',
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
    path: '/map-nl/',
    url: './pages/map-nl.html',
  },
  {
    path: '/map-eng/',
    url: './pages/map-eng.html',
  },
  {
    path: '/map-fr/',
    url: './pages/map-fr.html',
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
    path: '/about-nl/',
    url: './pages/about-nl.html',
  },
  {
    path: '/about-fr/',
    url: './pages/about-fr.html',
  },
  {
    path: '/about-eng/',
    url: './pages/about-eng.html',
  },
  {
    path: '/toegangspoort-nl/',
    url: './pages/toegangspoorten-nl.html',
  },
  {
    path: '/toegangspoort-fr/',
    url: './pages/toegangspoorten-fr.html',
  },
  {
    path: '/toegangspoort-eng/',
    url: './pages/toegangspoorten-eng.html',
  },
  {
    path: '/erfgoed-nl/',
    url: './pages/erfgoed-nl.html',
  },
  {
    path: '/erfgoed-fr/',
    url: './pages/erfgoed-fr.html',
  },
  {
    path: '/erfgoed-eng/',
    url: './pages/erfgoed-eng.html',
  },
  {
    path: '/ergoed-selected/',
    url: './pages/erfgoed-selected.html',
  },
  {
    path: '/faunaFlora-nl/',
    url: './pages/faunaFlora-nl.html',
  },
  {
    path: '/faunaFlora-fr/',
    url: './pages/faunaFlora-fr.html',
  },
  {
    path: '/faunaFlora-eng/',
    url: './pages/faunaFlora-eng.html',
  },

  {
    path: '/Event/',
    url: './pages/event.html',
  },
  {
    path: '/leaflet/',
    url: './pages/leaflettest.html',
  },
  // Default route (404 page). MUST BE THE LAST
  {
    path: '(.*)',
    url: './pages/404.html',
  },
];
