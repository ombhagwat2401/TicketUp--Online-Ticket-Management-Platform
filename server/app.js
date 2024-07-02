require("dotenv").config();
const express = require("express");
const app = express();
const cors = require("cors");
require("./db/conn")
const PORT = 6005;
const session = require("express-session");
const passport = require("passport");
const OAuth2Strategy = require("passport-google-oauth2").Strategy;
const userdb = require("./model/userSchema")
const eventdb = require("./model/eventSchema");

const clientid = "1006878441759-39sql2bjl3sro5tbhet2d77qumhk8q7d.apps.googleusercontent.com"
const clientsecret = "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"


app.use(cors({
    origin: "http://localhost:3000",
    methods: "GET,POST,PUT,DELETE",
    credentials: true
}));
app.use(express.json());

// setup session
app.use(session({
    secret: "YOUR SECRET KEY",
    resave: false,
    saveUninitialized: true
}))

// setuppassport
app.use(passport.initialize());
app.use(passport.session());

passport.use(
    new OAuth2Strategy({
        clientID: clientid,
        clientSecret: clientsecret,
        callbackURL: "/auth/google/callback",
        scope: ["profile", "email"]
    },
        async (accessToken, refreshToken, profile, done) => {
            try {
                let user = await userdb.findOne({ googleId: profile.id });

                if (!user) {
                    user = new userdb({
                        googleId: profile.id,
                        displayName: profile.displayName,
                        email: profile.emails[0].value,
                        image: profile.photos[0].value
                    });

                    await user.save();
                }

                return done(null, user)
            } catch (error) {
                return done(error, null)
            }
        }
    )
)

passport.serializeUser((user, done) => {
    done(null, user);
})

passport.deserializeUser((user, done) => {
    done(null, user);
});

// initial google ouath login
app.get("/auth/google", passport.authenticate("google", { scope: ["profile", "email"] }));

app.get("/auth/google/callback", passport.authenticate("google", {
    successRedirect: "http://localhost:3000/dashboard",
    failureRedirect: "http://localhost:3000/login"
}))

app.get("/login/sucess", async (req, res) => {

    if (req.user) {
        res.status(200).json({ message: "user Login", user: req.user })
    } else {
        res.status(400).json({ message: "Not Authorized" })
    }
})

app.get("/logout", (req, res, next) => {
    req.logout(function (err) {
        if (err) { return next(err) }
        res.redirect("http://localhost:3000");
    })
})





// Route to create a new event
app.post("/add-new-event", async (req, res) => {
    const { userId, eventName, eventPrice, image, eventAttendee } = req.body;

    try {
        const event = new eventdb({
            userId,
            eventName,
            eventPrice,
            image,
            eventAttendee
        });

        await event.save();
        res.status(201).json(event);
    } catch (error) {
        res.status(500).json({ message: "Server Error", error });
    }
});


app.get("/get-my-events/:userId", async (req, res) => {
    const { userId } = req.params;
    console.log("I am here", userId);


    try {
        const events = await eventdb.find({ userId });
        res.status(200).json(events);
    } catch (error) {
        res.status(500).json({ message: "Server Error", error });
    }
});


app.listen(PORT, () => {
    console.log(`server start at port no ${PORT}`)
})