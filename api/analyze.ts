import { GoogleGenerativeAI } from "@google/generative-ai";


export default async function handler(
req:any,
res:any
){

if(req.method !== "POST"){
return res.status(405).json({
error:"Method not allowed"
});
}


try{

const {
contractText,
userRole
}=req.body;


const genAI =
new GoogleGenerativeAI(
process.env.GEMINI_API_KEY!
);


const model =
genAI.getGenerativeModel({
model:"gemini-1.5-flash"
});


const prompt = `
You are ContractLens AI.

Analyze this contract.

Return only JSON.

{
health_score:number,
summary:string,
risks:[
{
title:string,
severity:string,
clause:string,
explanation:string,
fix:string,
negotiation_reply:string
}
]
}


Contract:
${contractText}
`;


const result =
await model.generateContent(prompt);


let output =
result.response.text();


output =
output
.replace(/```json/g,"")
.replace(/```/g,"")
.trim();


res.json({
success:true,
data:JSON.parse(output)
});


}catch(error){

console.log(error);

res.status(500).json({
success:false,
error:"AI analysis failed"
});

}

}
