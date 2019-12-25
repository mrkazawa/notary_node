<h3>How to run:</h3>

In `notary1`
```bash
SECRET="NODE0" P2P_PORT=5000 HTTP_PORT=3000 node app
```

In `notary2`
```bash
SECRET="NODE1" P2P_PORT=5001 HTTP_PORT=3001 PEERS=ws://notary1.local:5000 node app
```

In `notary3`
```bash
SECRET="NODE2" P2P_PORT=5002 HTTP_PORT=3002 PEERS=ws://notary2.local:5001,ws://notary1.local:5000 node app
```


Running the Private IPFS Network
https://medium.com/@s_van_laar/deploy-a-private-ipfs-network-on-ubuntu-in-5-steps-5aad95f7261b
