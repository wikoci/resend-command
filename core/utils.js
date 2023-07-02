
import { consola, createConsola } from "consola";
import 'dotenv/config'
import { generate, count } from "random-words";
import nodemailer from "nodemailer"
import _ from "lodash"
import inquirer from 'inquirer';
import path from "path"
import {v4} from "uuid"
import { Resend } from 'resend';
import {htmlToText} from "html-to-text"
import fs from "fs-extra"
import { glob, globSync, globStream, globStreamSync, Glob } from 'glob'
var mailsPaths = []
var contactsPaths=[]
const resend = new Resend(process.env.API_KEY||'');
const transport = nodemailer.createTransport({
   // service:'',
    host:process.env.SMTP_HOST||'127.0.0.1',
    port:Number(process.env.SMTP_PORT) ||25,
    secure: (process.env.SMTP_SECURE=='true' || process.env.SMTP_SECURE==true)  ? true:false,
    auth:{
        user:process.env.SMTP_USER||'',
        pass:process.env.SMTP_PASS||''
    }
})



async function rs(){
    mailsPaths  = await glob('./src/templates/**.{html,txt}')
    contactsPaths = await glob('./src/contacts/**.txt')
}


async function startSend(config){

    

    var index = 0
    var contacts = fs.readFileSync(config.contactList,"utf-8")
    var letter = fs.readFileSync(config.htmlTemplate,"utf-8")
    var domain = config.from||process.env.FROM_EMAIL
    domain = domain.split('@')[1]

   
    contacts = contacts.split('\n')||[]
    contacts= [...new Set(contacts)]
    contacts= contacts.filter(e=>e)
    contacts =_.uniq(contacts)
    var length = contacts?.length||0
    var i = 0
    var sc = setInterval(()=>{
        let fromIs = `${config.name||process.env.FROM_NAME} <${config.from||process.env.FROM_EMAIL}>`

            if(config.randomEmail==true || config.randomEmail=='true'){
                fromIs = `${config.name||process.env.FROM_NAME} <${v4()}@${domain}>`
            }

            consola.log(fromIs)

         
         var to = contacts[i]||null
       try{
        to = String(to.replace(/\s/g,''))
        if(to){
            consola.info(`${i}/${length} From : ${fromIs} | To => ${to}`)
            
            if(config.method=='resend'){
                resend.emails.send({
                    from:fromIs,
                    html:letter,
                    to:to,
                
                    text:htmlToText(letter),
                    subject:config.subject||process.env.SUBJECT
                 }).catch(err=>{
                    consola.error(err,to)
                 })
            }

            if(config.method=='smtp'){
                transport.sendMail({
                    from:fromIs,
                    html:letter,
                    to:to,
                    text:htmlToText(text),
                    subject:config.subject||process.env.SUBJECT,
                     date:new Date(),
                     textEncoding:'base64',
                }).catch(err=>{
                    consola.error(err,to)
                })
            }
          
        }
       } catch(err){
        
       }
       
         if(i==length){
                 consola.success('Send OK')
                 clearInterval(sc)
         } else{
           
         }
         i++
   
    },Number(process.env.INTERVAL))

   
}



async function exec(){

  


   await rs()
   var config ={
    id:"",
    name:"",
    from:"",
    htmlTemplate:null,
    contactList:null,
    subject:null,
    randomEmail:null,
    key:null,
    method:'resend'
   }

    consola.log('____Rsend_1.0____\n')
    consola.log('\n')
    config.method = await inquirer.prompt({
        name:'method',
        message:'What method use to start send ?',
        default:'resend',
        choices:['resend','smtp'],
        type:'list'
    }).then(v=>v.id)

    config.id = await inquirer.prompt({
        name:'id',
        message:'ID OF CAMPAIGN'
    }).then(v=>v.id)

    config.from = await inquirer.prompt({
        name:'From',
        message:'From (Email)'
    }).then(v=>v.From)

    config.name = await inquirer.prompt({
        name:'name',
        message:'Name of Organisation'
    }).then(v=>v.name)
  
    config.subject = await inquirer.prompt({
        name:'Subject',
        message:'Subject'
    }).then(v=>v.Subject)

    config.htmlTemplate = await inquirer.prompt({
        name:'HTMLTEMPLATE',
        message:'Select your letter ?',
        type:"list",
        choices:mailsPaths
    }).then(v=>v.HTMLTEMPLATE)
  
    config.contactList = await inquirer.prompt({
        name:'Contacts',
        type:"list",
        message:'Select your contact list',
        choices:contactsPaths
    }).then(v=>v.Contacts)
    console.log('\n')

    config.randomEmail = await inquirer.prompt({
        name:'randomEmail',
        type:"list",
        default:'false',
        message:'Do you want to use random E-mail provider ?',
        choices:['false','true']
    }).then(v=>v.randomEmail)

    var resp = await inquirer.prompt({
        name:'send',
        default:'true',
        type:"list",
        message:'Do you want to send Now ?',
        choices:['false','true']
    }).then(v=>v.send)

 

    if(resp=='true'){
        startSend(config)
    }
  
    
   


}

export{
    exec
}