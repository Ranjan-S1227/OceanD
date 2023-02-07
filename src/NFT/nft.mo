//This is a simple contract to create a new NFT programmatically.

import Debug "mo:base/Debug";
import Principal "mo:base/Principal";

// creating actor class, enables to create canisters programatically, bcz we are minting NFT.
//so everytime a new NFT is minted a new canister is created having unique Principal_ID making each NFT unique.
//the image is stored as 8bit natural number array.


//
actor class NFT(name: Text, owner: Principal, content: [Nat8])= this {

private let itemName=name;
private var nftOwner=owner;
private let imageBytes=content;

public query func getName(): async Text{
    return itemName;
};

public query func getOwner(): async Principal{
    return nftOwner;

};

public query func getAsset(): async [Nat8]{
 return imageBytes;
};

public query func getCanisterId(): async Principal{
    return Principal.fromActor(this);
};

public shared(msg) func transferOwnership(newOwner:Principal): async Text{
if(msg.caller==nftOwner){
nftOwner:= newOwner;
return "Success"; 
}else{
    return "Err: Not Initialted by owner."
};
};

}