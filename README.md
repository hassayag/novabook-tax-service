# novabook tax api

## Setup
1. `nvm use` (or node 20+)
2. `npm i`
3. Start docker daemon and run `docker-compose up -d` to setup database
4. `npm start`


## Questions
The invoice date field seems not so useful in my implementation, as the dates on items are used for checking tax position. Should it have more of a use, or is it simply the date attached at invoice creation?
