ID1=45132f5388262bbc2f113c5e0f69f56622c55198
ID2=6c23607b22b9adb745e6e95adba6220eda55cc0b
ID3=b82614e823b911a9b5360da18e344c106e033dee
ID4=5d3ef69cb6e5b530071bbbde2c3ec9e80219d309

IP1=10.0.0.11
IP2=10.0.0.12
IP3=10.0.0.13
IP4=10.0.0.14

tendermint node --home ./mytestnet/node3 --proxy_app=kvstore --p2p.persistent_peers="$ID1@$IP1:26656,$ID2@$IP2:26656,$ID3@$IP3:26656,$ID4@$IP4:26656"