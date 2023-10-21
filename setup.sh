echo " _____             __      ___               "
echo "|  __ \            \ \    / (_)              "
echo "| |__) | __ _____  _\ \  / / _  _____      __"
echo "|  ___/ '__/ _ \ \/ /\ \/ / | |/ _ \ \ /\ / /"
echo "| |   | | | (_) >  <  \  /  | |  __/\ V  V / "
echo "|_|   |_|  \___/_/\_\  \/   |_|\___| \_/\_/  "
echo " "
echo " "
echo " "

 


function installPackages() {
  sudo apt-get install npm
  sudo apt-get install nodejs
  npm install express
  npm install proxmox
  npm install fs
  npm install os
  npm install child_process
  npm install socket
  npm install http
  npm install moment
}

installPackages() > /dev/null;


# Ask for username and replace output with proxmoxpveuser in server.js file
echo "Proxview Configuration"
echo " "
echo "REQUIRE API AND API USER! (pve methode)"
echo ""

echo "username of api user: "
read username
sed -i "/proxviewpveuser/$username"; server.js

echo "password of api user: "
read password
sed -i "/proxviewpvemdp/$password"; server.js

echo "ip of poxmox: "
read ip
sed -i "/proxviexpveip/$ip"; server.js

echo "name of your node: "
read node_name
sed -i "/proxviexpvenode/$node_name"; server.js


