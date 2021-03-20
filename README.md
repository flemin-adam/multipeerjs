# multipeerjs

**Multipeer** is a javascript library that implemets the essential functionalities of WebRTC to make it easier to implement a multiple peer connection typically needed for a video conferencing application.

Getting Started:

Import **Multipeer** into your component.
```
import { Multipeer } from 'multipeer';
```

Next step is to initialize the Multipeer class.
```
let multiPeer = new Multipeer(rtcConfig, handleMultipeerCallback, mediaConstraints);
```
The constructor takes in 2 required and 1 optional parameter. The 1st parameter is the RTC Configuration object of the form [RTCConfiguration](https://developer.mozilla.org/en-US/docs/Web/API/RTCPeerConnection/RTCPeerConnection#rtcconfiguration_dictionary). 

Second parameter is a callback function that will be called whenever an event occurs or after an action is called for e.g. if you create an offer by calling createOffer(), the library will take the necessary steps to create the offer and then call this function with RTCEvent as an argument passed to it. You can then take the necessary steps to pass the message using your Signal Channel. A typical callback function would be of the form - 
```
handleMultipeerCallback = response => {
      switch(response.event){
        case RTCEventType.VIDEO_OFFER:{
          console.log("Offer Created");
          // response.email = myEmailId;
          // Send offer message to the client via your signalling channel 
          // socket.to(event.id).emit(RTCEventType.VIDEO_OFFER, response);
          break;
        }
        default:{
          console.log("Do Something");
          break;
        }
      }
    }
```

The third parameter is of the type [MediaStreamConstraints](https://developer.mozilla.org/en-US/docs/Web/API/MediaStreamConstraints). This is used to initialize your local video and audio stream.