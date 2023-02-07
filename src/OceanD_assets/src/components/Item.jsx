import React, { useEffect, useState } from "react";
import logo from "../../assets/logo.png";
import { HttpAgent, Actor } from "@dfinity/agent";
import {idlFactory} from "../../../declarations/nft/index";
import { Principal } from "@dfinity/principal";
import Button from "./Button";
import {OceanD} from "../../../declarations/OceanD";

import CURRENT_USER_ID from "../index";
import PriceLabel from "./PriceLabel";
import {idlFactory as swapXIdlFactory} from "../../../declarations/swapX";



function Item(props) {

  const [name, setName]=useState();
const [owner, setOwner]=useState();
const[image,setImage]=useState();
const[button,setButton]=useState();
const [priceInput, setPriceInput]=useState();
const [loaderHidden,setLoaderHidden]=useState(true);
const [blur, setBlur] = useState();
const [sellStatus,setSellStatus]=useState("");
const [priceLabel,setPriceLabel]=useState();
const [shouldDisplay,setDisplay ]=useState(true);

  const id=props.id;
  const localHost="http://localhost:8080";
  //run http req for getting hold of canister.
  const agent = new HttpAgent({host:localHost});
  agent.fetchRootKey();

  let NFTActor;


async function loadNFT(){
 NFTActor = await Actor.createActor(idlFactory,{
  agent,
  canisterId:id,

});
 const name = await NFTActor.getName();
 const owner = await NFTActor.getOwner();
const imageData = await NFTActor.getAsset();
const imageContent=new Uint8Array(imageData);

//We're actually converting an array of Nat eight numbers
 //from our back end that's stored on the internetcomputer blockchain 
 //into something that can be read by JavaScript.
const image = URL.createObjectURL(
  new Blob([imageContent.buffer],{type:"image/png"})
);


 setName(name);
 setOwner(owner.toText());
 setImage(image);
 
 if(props.role == "collection"){
  const nftIsListed = await OceanD.isListed(props.id);
  if(nftIsListed){
    setOwner("OceanD");
    setBlur({ filter: "blur(4px)" });
    setSellStatus("Listed");
  }else{
    setButton(<Button handleClick={handleSell} text={"Sell"}/>)
   
  }
 }else if(props.role=="discover"){
   const originalOwner= await OceanD.getOriginalOwner(props.id);
   if (originalOwner.toText() != CURRENT_USER_ID.toText()) {
    setButton(<Button handleClick={handleBuy} text={"Buy"} />);
  }
const price = await OceanD.getListedNFTPrice(props.id);
setPriceLabel(<PriceLabel sellPrice = {price.toString()}/>);
 }



};

useEffect(()=>{
  loadNFT();
},[]);

let price;

function handleSell(){
console.log("Sell");
setPriceInput(
  <input
    placeholder="Price in RJN"
    type="number"
    className="price-input"
    value={price}
    onChange={(e) => price=e.target.value}
  />
);

setButton(<Button handleClick={sellItem} text={"Confirm"} />);

};

async function sellItem(){
  setBlur({ filter: "blur(4px)" });
  setLoaderHidden(false);
  const listingResult =await OceanD.listItem(props.id,Number(price));
  console.log(listingResult);
  if (listingResult=="Success"){
    const OceanDId= await OceanD.getOceanDCanisterID();
    const transferResult=await NFTActor.transferOwnership(OceanDId);
    console.log(transferResult);
    if(transferResult=="Success"){
      setLoaderHidden(true);
      setButton();
      setPriceInput();
      setOwner("OceanD");
      setSellStatus("Listed");
    }

  }
};

async function handleBuy(){
  setLoaderHidden(false);
  console.log("Buy triggered!"); 
const swapXActor = await Actor.createActor(swapXIdlFactory,{
  agent,
  canisterId: Principal.fromText("qoctq-giaaa-aaaaa-aaaea-cai"),
});
const sellerId = await OceanD.getOriginalOwner(props.id);
const itemPrice = await OceanD.getListedNFTPrice(props.id);

const result =await swapXActor.transfer(sellerId,itemPrice);
console.log(result);
if(result=="Success"){
 const transferResult= await OceanD.completePurchase(props.id,sellerId,CURRENT_USER_ID);
 console.log(transferResult);
 setLoaderHidden(true);
 setDisplay(false);
}
}
  return (
    <div style={{display: shouldDisplay? "inline":"none"}} className="disGrid-item">
      <div className="disPaper-root disCard-root makeStyles-root-17 disPaper-elevation1 disPaper-rounded">
        <img
          className="disCardMedia-root makeStyles-image-19 disCardMedia-media disCardMedia-img"
          src={image}
          style={blur}
        />
        <div hidden={loaderHidden} className="lds-ellipsis">
    <div></div>
    <div></div>
    <div></div>
    <div></div>
    </div>
        <div className="disCardContent-root">
        {priceLabel}
          <h2 className="disTypography-root makeStyles-bodyText-24 disTypography-h5 disTypography-gutterBottom">
            {name}<span className="purple-text"> {sellStatus}</span>
          </h2>
          <p className="disTypography-root makeStyles-bodyText-24 disTypography-body2 disTypography-colorTextSecondary">
            Owner: {owner}
          </p>
          {priceInput}
          {button }
        </div>
      </div>
    </div>
  );
}

export default Item;
