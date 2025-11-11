# hf-planner
This repository contains the code for a browser application, used for planning one's concerts attendance at a music festival, using Python and FastAPI.

Users will be able to create accounts with username and password, then mark concerts as their favourites, and then access nice calendar views for their festival concerts agenda.

We will first start by creating three databases with SQLmodel :
- Concerts database, containing concert id, band name, day and time (of beginning and end), and stage (the festival has 6 different stages)
- User database, containing user id, username, and (probably hashed) password
- "Favourites" database, containing, for each row, a user id and a concert id they marked as favourite

We will also create sign-up and sign-in components.

The rest of the code will follow afterwards.