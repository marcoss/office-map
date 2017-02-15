/**
 * Author: Marcos Castaneda
 * Created: Feb 17, 2016
 */
var mapModule = (function() {
  var mapMarkers = [];

  // Cache DOM
  var $search = $('#search');
  var $input = $search.find('input');
  var $button = $search.find('searchNameButton');

  // init map
  var map = L.map('map', {
    minZoom: 2.7,
    maxZoom: 4,
    center: [0, 0],
    zoom: 2.7,
    crs: L.CRS.Simple,
    zoomControl: false
  });

  // Bind events
  $search.submit(function(e){
    e.preventDefault();
    search();
  });

  // map attributes
  function init() {
    map.on('popupopen', function(e) {
        var px = map.project(e.popup._latlng);
        px.y -= e.popup._container.clientHeight/2;
        map.panTo(map.unproject(px),{animate: true});
    });

    // hide 'powered by leaflet' text
    map.attributionControl.setPrefix('');

    // set dimensions of the image
    var w = 1335,
        h = 616,
        url = 'core/map.png';

    // calculate the edges of the image, in coordinate space
    var southWest = map.unproject([0, h], map.getMaxZoom()-1);
    var northEast = map.unproject([w, 0], map.getMaxZoom()-1);

    // add variable amount of padding to give corner popups readable space
    var padding = 250;
    var paddedSouthWest = map.unproject([-padding, h + padding], map.getMaxZoom()-1);
    var paddedNorthEast = map.unproject([w + padding, -padding], map.getMaxZoom()-1);

    var bounds = new L.LatLngBounds(southWest, northEast);
    var paddedBounds = new L.LatLngBounds(paddedSouthWest, paddedNorthEast);

    L.imageOverlay(url, bounds).addTo(map);    // add the image overlay,
    map.setMaxBounds(paddedBounds);           // set draggable map bounds
    map.addControl( L.control.zoom({position: 'bottomright'}) );

    // define icons appearance
    var LeafIcon = L.Icon.extend({
        options: {
            shadowUrl: 'core/icon.png',
            iconSize:     [38, 95],
            shadowSize:   [50, 64],
            iconAnchor:   [22, 94],
            shadowAnchor: [4, 62],
            popupAnchor:  [-3, -76]
        }
    });

    loadJSON();
  }

  function loadJSON() {
    // outline room polygons from geojson data
    $.getJSON("core/rooms_geojson.json", function(data) {

      var rooms = L.geoJson(data, {

        // Stylize boxes according to department
        style: function(feature) {
          switch (feature.properties.department) {
              case 'administration': return {color: "#f5999e", weight: 2};
              case 'faculty':   return {color: "#6dcff6", weight: 2};
              case 'common':   return {color: "#fef898", weight: 2};
              case 'student': return {color: "#A3D29C", weight: 2};
              default: return {color:'black', weight: 3};
          }
        },

        // Add pop-up
        onEachFeature: function (feature, layer) {

          // Check if empty
          if (feature.properties.tenant === '')
          {
            layer.bindPopup('<b>Empty</b><br> Room '+feature.properties.room);
          }
          else
          {
            layer.bindPopup('<img src="'+feature.properties.avatar+'" class="img-responsive avatar"><b>'+feature.properties.tenant+'</b><br> Room '+feature.properties.room, { "closeButton": false });
          }

          // Push marker to global array
          mapMarkers.push(layer);
        }

      }).addTo(map);

    });

    // plot the printers/devices from geojson data
    $.getJSON("core/devices_geojson.json", function(data) {

      var devices = L.geoJson(data, {

        pointToLayer: function(feature, latlng) {
           var smallIcon = L.icon({
                              iconSize: [35, 30],
                              iconAnchor: [20, 34],
                              popupAnchor:  [1, -24],
                              iconUrl: 'core/marker_printer.png'
           });

           return L.marker(latlng, {icon: smallIcon});
        },

        // Add pop-up
        onEachFeature: function (feature, layer) {
          layer.bindPopup(feature.properties.deviceName, { "closeButton": false });
        }

      }).addTo(map);

    });

  }

  function search() {
    str = $input.val();  // get user input
    var pattern = str.replace(/\s+/, "|");
    var rx = new RegExp(pattern, "gi");

    // check if search input is numerical
    var isNumericalSearch = !isNaN(str);

    for (var i in mapMarkers) {

      // Search for room #
      if (isNumericalSearch === true && rx.exec(mapMarkers[i].feature.properties.room))
      {
        mapMarkers[i].openPopup();

        $input.val('');

        if ($(window).width() < 480 || $(window).height() < 480) {
          document.activeElement.blur();  // dismiss keyboard in mobile
        }

        break;
      }

      // Search for room tenant
      else if (isNumericalSearch === false && rx.exec(mapMarkers[i].feature.properties.tenant))
      {
        mapMarkers[i].openPopup();
        $input.val('');

        if ($(window).width() < 480 || $(window).height() < 480) {
          document.activeElement.blur();  // dismiss keyboard in mobile
        }

        break;
      }
    }
  }

  // Expose APIs
  return {
    init: init
  };

})();

// document did load
$().ready(function() {
  mapModule.init();
});
