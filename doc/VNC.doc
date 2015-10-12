# VNC

## Implementation details

### Authentication

#### According to the spec

VNC authentication is very weak by default, and doesn't encrypt traffic in any way. It works by sending a random 16-byte challenge to the user, who then encrypts with his/her password and sends back the 16-byte result. The server then encrypts the challenge as well, and checks whether the result sent by the client matches the server's result. Passwords are required to be 8 characters long. Shorter passwords are padded with zeroes and longer passwords simply truncated. Both the server and the client have to know the password. There are no usernames.

#### The way we do it

Since the authentication is very weak anyway, we might as well exploit it. The problem with the spec method is that since there's no username, it's difficult to know *who* wants to connect to a device. The only place for any kind of information is the password, but without knowing the password we can't decrypt the challenge response to see the contents. While we could go through our whole user database encrypting the challenge with each user's password, that doesn't really scale in the long run, especially since we're interested in having per-device passwords as well (more on that later).

Instead, we send over a *static* challenge, e.g. 16 zeroes, every time. Then we simply identify the user by the returned challenge response itself, which is both unique and constant for each password. This makes the authentication more susceptible to eavesdropping since responses from previous sessions can be reused, but given the already weak nature of basic VNC authentication this shouldn't be a massive downgrade, and the app should be running inside an internal network anyway. For real security, all connections should be over a secure tunnel.

Furthermore, each password is only valid for a single device. This will enable interesting proxying and/or load balancing opportunities in the future as we should be able to expose every single device in the system via a single port if desired.
