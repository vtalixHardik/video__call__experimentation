# WebRTC P2P video call (Mesh Architecture)

## Backend (Signalling Service)

The signalling Service is used to locate both the clients before webRTC connection establishment

Although the objective of WebRTC connection is to make two client side Application communicate to each other, Both the Peers still needs a small assistance from a Server Side Application to locate each other and exchange information around each others generated SDP and ICE Candidates

### External Dependencies

1. socket.io ( for creating a event-driven bi-directional communication between client and server side application)
2. express (for initializing server side application for webSockets)
3. uuid (for assigning an ID to a non - existing meeting)
4. dotenv (for injecting secrets)

#### 1. HTTP GET /api/v1/signalling/health-status

Description:

```
This endpoint is used for live running of Server Side Application when in Production
```

Body:

```
none
```

Response :

```

{}
```

#### 2. HTTP PUT /api/v1/signalling/save-chats/:appointment_id

Description:

```
This endpoint is used for Saving Chats for a meeting, It is called at regular intervals from the Frontend
```

Body:

```
{
    chats: [] //array of objects
}
```

Response :

```
{
    success: true,
    message: "Chats saved Successfully"
}
```

#### 3. SOCKET ON connection

Description:

```
This endpoint is used for creating a stateful session with Server Side Application
```

Body:

```
none
```

Response :

```
none
```

#### 4. SOCKET ON join_room

Description:

```
This endpoint is used joining a unique room at the Server Side Application for unique identification of relation between users, in other words an essential process for the Backend to know which two Clients wants to interact with each other
```

Body:

```
{
    appointment_id: String// must be unique,
    name: String,
}
```

Response :

```
{
  message: "Joined Successfully",
  remoteSocket: String,// remote Socket ID of other user
  opponent_name: String,// name of other user
  chats: array of objects,// previous chats
}
```

#### 5. SOCKET ON send_offer

Description:

```
This endpoint is used for sending an offer to the remote client who we want to talk
```

Body:

```
{
    appointment_id: String,// to identify meeting in data base
    offer: Object,// SDP of one client, being sent to the other
    remoteSocketId : String,// Remote Socket ID of the  recieving client
}
```

Response :

```
{
        from: String,// socket ID of the user who sent the offer
        offer: Object,// SDP offer of the remote user
        name: String,// name of the user sending offer
      }
```

#### 6. SOCKET ON send_answer

Description:

```
This endpoint is used for sending the answer(an SDP(Session Description Protocol), of data type Object), a kind of response to an offer
```

Body:

```
{
    appointment_id: String,// Appointment ID to identify the meeting in database
    answer: Object,// SDP Answer of the user who just received SDP offer
    remoteSocketId: String,// Socket ID of the user to whom we want to send the answer to
}
```

Response :

```
{
    from: String,// Socket ID of the user who sent the answer
    answer: Object,// SDP Answer
}
```

#### 7. SOCKET ON ice_candidate

Description:

```
This endpoint is used for exchanging ICE candidates of the users
```

Body:

```
{ 
    remoteSocketId: String,// Socket ID of user to whom we want to send the candidate to  
    candidate: Object, //ICE Candidate of other user
}
```

Response :

```
{
    candidate: Object, // candidate of other user
}
```

#### 8. SOCKET ON disconnect

Description:

```
This endpoint is triggered when a User Leaves, that is, if they close there browser, close there tab, component of Video Call Unmounts, etc, ...
```

Body:

```
none
```

Response :

```
{
    message: String,
}
```

## Frontend ( ReactJS, TailwindCSS )

```
The Client Side application is built in ReactJS

The routing is handled through dependencies such as react-router-dom

The Client Side Application contains of two Pages
1. Login
2. Room

0. App.jsx: This is where Routing happens, this is where referencing storing names and appointment ID are stored
1. Login2.jsx Page: This is used to for a user to add a unique AppointmentID and their Name( When integrated with vtalix, appointment ID and name are taken automatically)
2.ThirdRoom3.jsx Page: This is where the actual Video Call Happens, it takes AppointmentId, name , report and transcript as props


```
```
External Dependencies
1.) react-router-dom
2.) socket.io-client

```
ThirdRoom.jsx
```
```