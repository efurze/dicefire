####Installation Instructions

```
git clone https://github.com/mikeslemmer/dicefire.git dicefire
cd dicefire
npm install
brew install redis
grunt server
```

See [installing redis](https://medium.com/@petehouston/install-and-config-redis-on-mac-os-x-via-homebrew-eb8df9a4f298#.oxu6mzkvd) for more.

Once the server has started, point your browser to [http://localhost:5000](http://localhost:5000)






Sounds from:

http://www.freesfx.co.uk

For login to work, you have to set up a facebook app and put it in config/secrets.js. Also you'll need to set up a hosts file so your local URL matches the one you told facebook.
