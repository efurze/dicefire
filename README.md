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

##### Some Out-of-the-Box User AIs [optional]

If you want some sample user-submitted AIs to play around with, run this command BEFORE starting the server:
```
cp data/db_with_only_AIs.rdb dump.rdb
```
You should now see a list of 9 (or so) AIs under 'AI Leaderboard' if you do this.



---

Sounds from:

http://www.freesfx.co.uk

For login to work, you have to set up a facebook app and put it in config/secrets.js. Also you'll need to set up a hosts file so your local URL matches the one you told facebook.
