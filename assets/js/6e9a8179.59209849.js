"use strict";(self.webpackChunkcf_functions=self.webpackChunkcf_functions||[]).push([[529],{3905:(e,t,n)=>{n.d(t,{Zo:()=>p,kt:()=>d});var o=n(7294);function i(e,t,n){return t in e?Object.defineProperty(e,t,{value:n,enumerable:!0,configurable:!0,writable:!0}):e[t]=n,e}function r(e,t){var n=Object.keys(e);if(Object.getOwnPropertySymbols){var o=Object.getOwnPropertySymbols(e);t&&(o=o.filter((function(t){return Object.getOwnPropertyDescriptor(e,t).enumerable}))),n.push.apply(n,o)}return n}function a(e){for(var t=1;t<arguments.length;t++){var n=null!=arguments[t]?arguments[t]:{};t%2?r(Object(n),!0).forEach((function(t){i(e,t,n[t])})):Object.getOwnPropertyDescriptors?Object.defineProperties(e,Object.getOwnPropertyDescriptors(n)):r(Object(n)).forEach((function(t){Object.defineProperty(e,t,Object.getOwnPropertyDescriptor(n,t))}))}return e}function s(e,t){if(null==e)return{};var n,o,i=function(e,t){if(null==e)return{};var n,o,i={},r=Object.keys(e);for(o=0;o<r.length;o++)n=r[o],t.indexOf(n)>=0||(i[n]=e[n]);return i}(e,t);if(Object.getOwnPropertySymbols){var r=Object.getOwnPropertySymbols(e);for(o=0;o<r.length;o++)n=r[o],t.indexOf(n)>=0||Object.prototype.propertyIsEnumerable.call(e,n)&&(i[n]=e[n])}return i}var l=o.createContext({}),c=function(e){var t=o.useContext(l),n=t;return e&&(n="function"==typeof e?e(t):a(a({},t),e)),n},p=function(e){var t=c(e.components);return o.createElement(l.Provider,{value:t},e.children)},u={inlineCode:"code",wrapper:function(e){var t=e.children;return o.createElement(o.Fragment,{},t)}},m=o.forwardRef((function(e,t){var n=e.components,i=e.mdxType,r=e.originalType,l=e.parentName,p=s(e,["components","mdxType","originalType","parentName"]),m=c(n),d=i,f=m["".concat(l,".").concat(d)]||m[d]||u[d]||r;return n?o.createElement(f,a(a({ref:t},p),{},{components:n})):o.createElement(f,a({ref:t},p))}));function d(e,t){var n=arguments,i=t&&t.mdxType;if("string"==typeof e||i){var r=n.length,a=new Array(r);a[0]=m;var s={};for(var l in t)hasOwnProperty.call(t,l)&&(s[l]=t[l]);s.originalType=e,s.mdxType="string"==typeof e?e:i,a[1]=s;for(var c=2;c<r;c++)a[c]=n[c];return o.createElement.apply(null,a)}return o.createElement.apply(null,n)}m.displayName="MDXCreateElement"},5251:(e,t,n)=>{n.r(t),n.d(t,{assets:()=>l,contentTitle:()=>a,default:()=>u,frontMatter:()=>r,metadata:()=>s,toc:()=>c});var o=n(7462),i=(n(7294),n(3905));const r={},a="Deployment",s={unversionedId:"usage/deployment",id:"usage/deployment",title:"Deployment",description:"The framework parses the configuration file for deployment mappings when using any of the below commands.",source:"@site/docs/usage/deployment.mdx",sourceDirName:"usage",slug:"/usage/deployment",permalink:"/cf-functions/docs/usage/deployment",draft:!1,tags:[],version:"current",frontMatter:{},sidebar:"docs",previous:{title:"Typescript",permalink:"/cf-functions/docs/usage/typescript"},next:{title:"Testing",permalink:"/cf-functions/docs/usage/testing"}},l={},c=[{value:"1. Stage",id:"1-stage",level:2},{value:"2. Test",id:"2-test",level:2},{value:"3. Publish",id:"3-publish",level:2},{value:"4. Associate",id:"4-associate",level:2}],p={toc:c};function u(e){let{components:t,...n}=e;return(0,i.kt)("wrapper",(0,o.Z)({},p,n,{components:t,mdxType:"MDXLayout"}),(0,i.kt)("h1",{id:"deployment"},"Deployment"),(0,i.kt)("p",null,"The framework parses the ",(0,i.kt)("a",{parentName:"p",href:"./configuration"},"configuration")," file for deployment mappings when using any of the below commands.\nCloudFront Function deployments occur in four stages:"),(0,i.kt)("ol",null,(0,i.kt)("li",{parentName:"ol"},"Stage function in the ",(0,i.kt)("inlineCode",{parentName:"li"},"DEVELOPMENT")," environment."),(0,i.kt)("li",{parentName:"ol"},"Test function in the ",(0,i.kt)("inlineCode",{parentName:"li"},"DEVELOPMENT")," environment."),(0,i.kt)("li",{parentName:"ol"},"Publish function to the ",(0,i.kt)("inlineCode",{parentName:"li"},"LIVE")," environment."),(0,i.kt)("li",{parentName:"ol"},"Associate function with a CloudFront Distribution behaviour.")),(0,i.kt)("div",{style:{marginTop:"50px",display:"flex",justifyContent:"center"}},(0,i.kt)("a",{href:"/cf-functions/img/deploy-workflow.png",target:"_blank"},(0,i.kt)("img",{src:"/cf-functions/img/deploy-workflow.png",alt:"Deployment workflow"}))),(0,i.kt)("h2",{id:"1-stage"},"1. Stage"),(0,i.kt)("p",null,"Staging a function creates the function in CloudFront if it doesn't already exist, or updates the handler code\n(only in the ",(0,i.kt)("inlineCode",{parentName:"p"},"DEVELOPMENT")," environment) if it does exist."),(0,i.kt)("p",null,"Functions in the ",(0,i.kt)("inlineCode",{parentName:"p"},"DEVELOPMENT")," environment cannot be associated with a distribution yet, but they can be tested. When\ndeveloping your function code, you can use the ",(0,i.kt)("inlineCode",{parentName:"p"},"stage")," command to push it to AWS for ",(0,i.kt)("a",{parentName:"p",href:"./testing"},"testing"),"."),(0,i.kt)("pre",null,(0,i.kt)("code",{parentName:"pre",className:"language-shell"},"cf-functions stage\n")),(0,i.kt)("video",{width:"100%",controls:!0},(0,i.kt)("source",{src:"/cf-functions/video/stage-example.mp4",type:"video/mp4"})),(0,i.kt)("h2",{id:"2-test"},"2. Test"),(0,i.kt)("p",null,"Refer to the ",(0,i.kt)("a",{parentName:"p",href:"./testing"},"testing")," page for more information."),(0,i.kt)("h2",{id:"3-publish"},"3. Publish"),(0,i.kt)("p",null,"Publishing a function copies the function from the ",(0,i.kt)("inlineCode",{parentName:"p"},"DEVELOPMENT")," environment to the ",(0,i.kt)("inlineCode",{parentName:"p"},"LIVE")," environment. A function in the\n",(0,i.kt)("inlineCode",{parentName:"p"},"LIVE")," environment can be tested and additionally associated with CloudFront Distribution behaviours."),(0,i.kt)("p",null,"When publishing a function to ",(0,i.kt)("inlineCode",{parentName:"p"},"LIVE"),", any existing distribution associations will begin using the new version of the\nfunction."),(0,i.kt)("pre",null,(0,i.kt)("code",{parentName:"pre",className:"language-shell"},"cf-functions publish\n")),(0,i.kt)("video",{width:"100%",controls:!0},(0,i.kt)("source",{src:"/cf-functions/video/publish-example.mp4",type:"video/mp4"})),(0,i.kt)("h2",{id:"4-associate"},"4. Associate"),(0,i.kt)("p",null,"A function in the ",(0,i.kt)("inlineCode",{parentName:"p"},"LIVE")," environment can be associated with a single or multiple CloudFront Distribution behaviour(s). Once\nan association is made, on either ",(0,i.kt)("inlineCode",{parentName:"p"},"viewer-request")," or ",(0,i.kt)("inlineCode",{parentName:"p"},"viewer-response"),", the function will be executed every time the\ndistribution behaviour event occurs."),(0,i.kt)("admonition",{type:"info"},(0,i.kt)("p",{parentName:"admonition"},"If your function associations are handled by an external system such as Terraform or the CDK, the ",(0,i.kt)("inlineCode",{parentName:"p"},"associate")," command is\nnot required, simply exclude this step from your CI/CD workflow.")),(0,i.kt)("pre",null,(0,i.kt)("code",{parentName:"pre",className:"language-shell"},"cf-functions associate\n")),(0,i.kt)("video",{width:"100%",controls:!0},(0,i.kt)("source",{src:"/cf-functions/video/associate-example.mp4",type:"video/mp4"})),(0,i.kt)("admonition",{type:"note"},(0,i.kt)("p",{parentName:"admonition"},"It can take up to 5 minutes for an associate command to complete, due to the fact that each CloudFront edge node needs\nto be updated for the distribution status to return to ",(0,i.kt)("inlineCode",{parentName:"p"},"DEPLOYED"),".")),(0,i.kt)("p",null,"Use ",(0,i.kt)("inlineCode",{parentName:"p"},"cf-functions help")," for more information on commands."))}u.isMDXComponent=!0}}]);