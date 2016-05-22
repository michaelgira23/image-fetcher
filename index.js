var config = {
    port: 1500,
    subreddits: [
        'earthporn'
    ]
};

// JSON URL for getting images
var url = 'https://www.reddit.com/r/' + config.subreddits.join('+') + '.json';

var express = require('express');
var app     = express();
var request = require('request');
var Random  = require('random-js');
var engine  = Random.engines.mt19937().autoSeed();
var fs      = require('fs');

// Callback returns image data, false if error
function getImage(callback) {
    request(url, function(err, res, body) {
        if(err) {
            callback(false);
            return;
        }
        var json = JSON.parse(body);
        var posts = json.data.children;
        var randomPosts = Random.shuffle(engine, posts);
        
        // Go through each post returned by JSON
        var validImage = false;
        for(var i = 0; i < randomPosts.length; i++) {
            var post = randomPosts[i];
            
            // If post is text, skip
            if(typeof post.data.preview === 'undefined') continue;
            
            // Get image data
            var imageData = post.data.preview.images[0].source;
            
            var image = {
                url   : imageData.url,
                width : imageData.width,
                height: imageData.height
            };
            
            validImage = true;
            callback(image);
            
            
            // TODO: Check for image resolution/ratio and skip to next one if requirements aren't met
            break;
        }
        // If not valid image, return false
        if(!validImage) {
            callback(false);
        }
    });
}

app.get('/', function(req, res) {
    getImage(function(image) {
        if(image) {
            request(image.url).pipe(res);
        } else {
            
            // Fallback iamge if all else fails
            fs.readFile(__dirname + '/default.jpg', function(err, data) {
                if(!err) {
                    res.writeHead(200, {'Content-Type': 'image/jpeg'});
                    res.end(data, 'binary');
                } else {
                    res.status(404).send('Something did an uh oh. Try again later.');
                }
            });
            
        }
    });
});

app.listen(config.port, function() {
    console.log('Server listening on *:' + config.port);
});