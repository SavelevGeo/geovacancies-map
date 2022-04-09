mapboxgl.accessToken = 'pk.eyJ1Ijoic2F2ZWxldmdlbyIsImEiOiJjbDEzc3kwcGUwMHBtM2NwZHcxMWtzejMxIn0.j4Y_L3ZDgghN6MfthNOYRg'

document.addEventListener('DOMContentLoaded', () => {
  var map = new mapboxgl.Map({
    container: 'map',
    style: 'mapbox://styles/savelevgeo/cl18ediq6002g14qghfltfp29',
    center: [55, 55],
    zoom: 3
  });
  
  const gDocLink = 'https://docs.google.com/spreadsheets/d/183Rw_ES98k4C2_0VyYfx8XW52ECW5wKIRy7KnRZ74k8/gviz/tq?tqx=out:csv&sheet=Лист1';
  fetch(gDocLink)
    .then(csvResponse => csvResponse.text())
    .then(csvData => addToMap(csvData));
  
  function addToMap(csvText) {
    csv2geojson.csv2geojson(csvText, {
      latfield: 'lat',
      lonfield: 'lon',
      delimiter: ','
      },
      (err, data) => {
        map.addSource('vacancies', {
          type: 'geojson',
          data: data,
          cluster: true,
          clusterRadius: 20,
          attribution: 'by <b><a href="https://github.com/SavelevGeo">SavelevGeo</a></b> | <b><a href="https://cartetika.ru/geovacancy">Страница геовакансий</a></b>'
        });

        //clustered_points
        map.addLayer({
          id: 'clusters',
          source: 'vacancies',
          type: 'circle',
          filter: ['has', 'point_count'],
          paint: {
            'circle-color': '#fae67f',
            'circle-stroke-width': 1,
            'circle-stroke-color': '#3b3334',
            'circle-radius': [
              'step',
              ['get', 'point_count'],
              15,
              5,
              20,
              10,
              25
            ]
          }
        }); 
        
        //unclustered points
        map.addLayer({
          id: 'unclustered',
          source: 'vacancies',
          type: 'circle',
          filter: ['!', ['has', 'point_count']],
          paint: {
            'circle-color': '#fae67f',
            'circle-stroke-width': 1,
            'circle-stroke-color': '#3b3334',
            'circle-radius': 10
          }
        });

        //location labels for unclustered
        map.addLayer({
          id: 'location-labels',
          type: 'symbol',
          source: 'vacancies',
          filter: ['!', ['has', 'point_count']],
          layout: {
            'text-allow-overlap': true,
            'text-anchor': 'left',
            'text-field': '{Город}',
            'text-font': ['Roboto Light', 'Arial Unicode MS Bold'],
            'text-justify': 'left',
            'text-offset': [1, 0],
            'text-size': 12
          }
        });        

        //cluster labels
        map.addLayer({
          id: 'cluster-count-labels',
          type: 'symbol',
          source: 'vacancies',
          filter: ['has', 'point_count'],
          layout: {
            'text-field': '{point_count}',
            'text-font': ['Roboto Black', 'Arial Unicode MS Bold'],
            'text-size': 12,
            'text-offset': [-0.05, 0.1]
          }
        });

        //##POPUPS##
        //expanding vacancy card
        function expandVac(evt) {
          let vacElements = evt.target.parentNode.querySelectorAll(':not(.vacancy__header)');
          vacElements.forEach((e) => e.hidden = !e.hidden);
        }

        //filling up vacancy data 
        function getVacancyDesc(feat) {
          let vacElement = document.createElement('span');
          vacElement.className = 'vacancy';
          vacElement.style.position = 'relative';

          let vacHeader = document.createElement('h3');
          vacHeader.className = 'vacancy__header';
          vacHeader.innerHTML = feat.properties['Вакансия'];

          let vacCompany = document.createElement('div');
          vacCompany.className = 'vacancy__company';
          vacCompany.innerHTML = feat.properties['Работодатель'];
          vacCompany.hidden = true;

          let cartLogo = document.createElement('img');
          cartLogo.src = './img/cartetica_logo.png';
          cartLogo.width = '25';
          cartLogo.hidden = true;

          let cartLink = document.createElement('a');
          cartLogo.className = 'cart_link';
          cartLink.href = feat.properties['Ссылка на сайте Картетики'];
          cartLink.appendChild(cartLogo);
          cartLink.hidden = true;

          let vacSalary = document.createElement('div');
          vacSalary.className = 'vacancy__salary';
          vacSalary.innerHTML = feat.properties['ЗП'];
          vacSalary.hidden = true;

          vacElement.append(vacHeader, vacCompany, vacSalary, cartLink);
          return vacElement.outerHTML;
        };

        //popup initializing
        const popup = new mapboxgl.Popup({
          anchor: 'right',
          className: 'popup'
        });
        
        const clusterSource = map.getSource('vacancies');
        function displayPopup(e) {
          
          //geting hovered feature and its geometry
          const feat = e.features[0];
          const coordinates = feat.geometry.coordinates.slice();

          if (feat.properties.cluster) {
            var popupHTML = '';
            clusterSource.getClusterLeaves(
              feat.properties.cluster_id,
              feat.properties.point_count,
              0, (error, clusteredFeatures) => {
                //create popup
                clusteredFeatures.forEach(f => popupHTML += getVacancyDesc(f));
                popup.setLngLat(coordinates).setHTML(popupHTML).addTo(map);
                
                //for map moving (unfinished)
                var popupElement = document.querySelector('.popup');
                var rect = popupElement.getBoundingClientRect();
                console.log(rect);

                //event listeners for expanding vacancies data
                var vacElements = document.querySelectorAll('.vacancy__header');
                vacElements.forEach((e) => e.addEventListener('click', expandVac));
              });
          }
          else {
            //create popup
            popupHTML = getVacancyDesc(feat);
            popup.setLngLat(coordinates).setHTML(popupHTML).addTo(map);
            
            //event listeners for expanding vacancies data
            var vacElement = document.querySelector('.vacancy__header');
            vacElement.addEventListener('click', expandVac);
          };
        };

        //hovering from cluster point event
        function hidePopup() { map.getCanvas().style.cursor = ''; }

        //linking hovering events to displaying/hiding popups
        map.on('click', 'clusters', displayPopup);
        map.on('click', 'unclustered', displayPopup);
        map.on('mouseenter', 'clusters', () => map.getCanvas().style.cursor = 'pointer');
        map.on('mouseenter', 'unclustered', () => map.getCanvas().style.cursor = 'pointer');
        map.on('mouseleave', 'clusters', hidePopup);
        map.on('mouseleave', 'unclustered', hidePopup);

        //for visible vacancies list (unfinished)
        map.on('idle', () => {
          const feats = map.queryRenderedFeatures({layers: ['clusters']});
          const firstHalf = feats.slice(0, Math.ceil(feats.length / 2));
          //console.log(firstHalf);
        });
      });
  };
});
