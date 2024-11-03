const Location = require("../../app_api/models/locations");
const { response } = require("express");
var request = require("request");

const apiOptions = {
  server: "http://localhost:3000",
};

if (process.env.NODE_ENV === "production") {
  apiOptions.server = "https://yourapi.com";
}

// Home page (location list)
const homelist = (req, res) => {
  const path = "/api/locations";
  const requestOptions = {
    url: `${apiOptions.server}${path}`,
    method: "GET",
    json: {}, 
    qs: {
      lng: 127.266936, 
      lat: 37.003354,
      maxDistance: 200000,
    },
  };

  request(requestOptions, (err, { statusCode } = {}, body) => {
    let data = [];
    if (err) {
      return showError(req, res, 500); // Handle request error
    }
    if (statusCode === 200 && Array.isArray(body)) {
      data = body.map((item) => {
        item.distance = formatDistance(item.distance);
        return item;
      });
    } else {
      return showError(req, res, statusCode); // Handle non-200 response
    }
    renderHomepage(req, res, data);
  });
};

// Format distance function
const formatDistance = (distance) => {
  let thisDistance = 0;
  let unit = "m";
  if (distance > 1000) {
    thisDistance = parseFloat(distance / 1000).toFixed(1);
    unit = "km";
  } else {
    thisDistance = Math.floor(distance);
  }
  return thisDistance + unit;
};

// Render homepage with location data
const renderHomepage = (req, res, responseBody) => {
  let message = null;
  if (!(responseBody instanceof Array)) {
    message = "API Lookup error";
    responseBody = [];
  } else if (!responseBody.length) {
    message = "No places found nearby";
  }
  res.render("location-list", {
    title: "Loc8r - find a place to work with wifi",
    pageHeader: {
      title: "Loc8r",
      strapline: "Find places to work with wifi near you!",
    },
    sidebar:
      "Looking for wifi and a seat? Loc8r helps you find places to work when out and about. Perhaps with coffee, cake or a pint? Let Loc8r help you find the place you're looking for.",
    locations: responseBody,
    message,
  });
};

const showError = (req, res, status) => {
  let title = "";
  let content = "";
  if (status === 404) {
    title = "404, page not found";
    content = "Oh dear, Looks like you can't find this page. Sorry";
  } else {
    title = `${status}, something's gone wrong`;
    content = "Something, somewhere, has gone just a little bit wrong";
  }
  res.status(status);
  res.render("generic-text", {
    title,
    content,
  });
};

// Render location details page
const renderDetailPage = (req, res, location) => {
  res.render("location-info", {
    title: location.name,
    pageHeader: {
      title: location.name,
    },
    sidebar: {
      context:
        "is on Loc8r because it has accessible wifi and space to sit down with your laptop and get some work done.",
      callToAction:
        "If you've been and you like it - or if you don't - please leave a review to help other people just like you.",
    },
    location,
  });
};

const renderReviewForm = function (req, res, {name}) {
  res.render("location-review-form", {
    title: `Review ${name} on Loc8r`,
    pageHeader: { title: `Review ${name}` },
    error: req.query.err
  });
};


const getLocationInfo = (req, res, callback) => {
  const path = `/api/locations/${req.params.locationid}`;
  const requestOptions = {
    url: `${apiOptions.server}${path}`,
    method: "GET",
    json: {},
  };
  request(requestOptions, (err, { statusCode } = {}, body) => {
    if (err) {
      return showError(req, res, 500);
    }
    if (statusCode === 200) {
      body.coords = {
        lng: body.coords[0],
        lat: body.coords[1],
      };
      callback(req, res, body);
    } else {
      showError(req, res, statusCode);
    }
  });
};

const locationInfo = (req, res) => {
  getLocationInfo(req, res,
    (req, res, responseData) => renderDetailPage(req, res, responseData)
  );
};

const addReview = (req, res) => {
  getLocationInfo(req, res,
    (req, res, responseData) => renderReviewForm(req, res, responseData)
  );
};

const doAddReview = (req, res) => {
  const locationid = req.params.locationid;
  const path = `/api/locations/${locationid}/reviews`
  const postdata = {
    author: req.body.name,
    rating: parseInt(req.body.rating, 10),
    reviewText: req.body.review
  }
  const requestOptions = {
    url: `${apiOptions.server}${path}`,
    method: 'POST',
    json: postdata
  }
  if(!postdata.author || !postdata.rating || !postdata.reviewText){
    res.redirect(`/location/${locationid}/review/new?err=val`)
  }else{
    request(requestOptions, (err, {statusCode}, {name}) => {
      if(statusCode == 201){
        res.redirect(`/location/${locationid}`)
      }else if (statusCode === 400 && name && name === 'Validation failed'){
        res.redirect(`/location/${locationid}/review/new?err=val`)
      }else{
        showError(req, res, statusCode);
      }
    })
  }
};


module.exports = {
  homelist,
  locationInfo,
  addReview,
  doAddReview
};
