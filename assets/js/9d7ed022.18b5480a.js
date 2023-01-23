"use strict";(self.webpackChunkcf_functions=self.webpackChunkcf_functions||[]).push([[262],{3905:(e,t,n)=>{n.d(t,{Zo:()=>l,kt:()=>d});var r=n(7294);function o(e,t,n){return t in e?Object.defineProperty(e,t,{value:n,enumerable:!0,configurable:!0,writable:!0}):e[t]=n,e}function a(e,t){var n=Object.keys(e);if(Object.getOwnPropertySymbols){var r=Object.getOwnPropertySymbols(e);t&&(r=r.filter((function(t){return Object.getOwnPropertyDescriptor(e,t).enumerable}))),n.push.apply(n,r)}return n}function i(e){for(var t=1;t<arguments.length;t++){var n=null!=arguments[t]?arguments[t]:{};t%2?a(Object(n),!0).forEach((function(t){o(e,t,n[t])})):Object.getOwnPropertyDescriptors?Object.defineProperties(e,Object.getOwnPropertyDescriptors(n)):a(Object(n)).forEach((function(t){Object.defineProperty(e,t,Object.getOwnPropertyDescriptor(n,t))}))}return e}function s(e,t){if(null==e)return{};var n,r,o=function(e,t){if(null==e)return{};var n,r,o={},a=Object.keys(e);for(r=0;r<a.length;r++)n=a[r],t.indexOf(n)>=0||(o[n]=e[n]);return o}(e,t);if(Object.getOwnPropertySymbols){var a=Object.getOwnPropertySymbols(e);for(r=0;r<a.length;r++)n=a[r],t.indexOf(n)>=0||Object.prototype.propertyIsEnumerable.call(e,n)&&(o[n]=e[n])}return o}var c=r.createContext({}),p=function(e){var t=r.useContext(c),n=t;return e&&(n="function"==typeof e?e(t):i(i({},t),e)),n},l=function(e){var t=p(e.components);return r.createElement(c.Provider,{value:t},e.children)},u={inlineCode:"code",wrapper:function(e){var t=e.children;return r.createElement(r.Fragment,{},t)}},f=r.forwardRef((function(e,t){var n=e.components,o=e.mdxType,a=e.originalType,c=e.parentName,l=s(e,["components","mdxType","originalType","parentName"]),f=p(n),d=o,y=f["".concat(c,".").concat(d)]||f[d]||u[d]||a;return n?r.createElement(y,i(i({ref:t},l),{},{components:n})):r.createElement(y,i({ref:t},l))}));function d(e,t){var n=arguments,o=t&&t.mdxType;if("string"==typeof e||o){var a=n.length,i=new Array(a);i[0]=f;var s={};for(var c in t)hasOwnProperty.call(t,c)&&(s[c]=t[c]);s.originalType=e,s.mdxType="string"==typeof e?e:o,i[1]=s;for(var p=2;p<a;p++)i[p]=n[p];return r.createElement.apply(null,i)}return r.createElement.apply(null,n)}f.displayName="MDXCreateElement"},8726:(e,t,n)=>{n.r(t),n.d(t,{assets:()=>c,contentTitle:()=>i,default:()=>u,frontMatter:()=>a,metadata:()=>s,toc:()=>p});var r=n(7462),o=(n(7294),n(3905));const a={},i="Typescript",s={unversionedId:"usage/typescript",id:"usage/typescript",title:"Typescript",description:"The framework supports Typescript out of the box, no additional configuration required. This means the cf-functions",source:"@site/docs/usage/typescript.mdx",sourceDirName:"usage",slug:"/usage/typescript",permalink:"/cf-functions/docs/usage/typescript",draft:!1,tags:[],version:"current",frontMatter:{},sidebar:"docs",previous:{title:"Configuration",permalink:"/cf-functions/docs/usage/configuration"},next:{title:"Deployment",permalink:"/cf-functions/docs/usage/deployment"}},c={},p=[{value:"Vanilla JS",id:"vanilla-js",level:2}],l={toc:p};function u(e){let{components:t,...n}=e;return(0,o.kt)("wrapper",(0,r.Z)({},l,n,{components:t,mdxType:"MDXLayout"}),(0,o.kt)("h1",{id:"typescript"},"Typescript"),(0,o.kt)("p",null,"The framework supports Typescript out of the box, no additional configuration required. This means the ",(0,o.kt)("inlineCode",{parentName:"p"},"cf-functions"),"\nconfig file as well as any handler code or test files can all be ",(0,o.kt)("inlineCode",{parentName:"p"},".ts")," files."),(0,o.kt)("p",null,"A number of useful types related to CloudFront Functions have been included in this package. Check the ",(0,o.kt)("inlineCode",{parentName:"p"},"index.js")," of this\npackage for a list of bundled types."),(0,o.kt)("h2",{id:"vanilla-js"},"Vanilla JS"),(0,o.kt)("p",null,"If you prefer to use vanilla Javascript, this is also possible. Ensure that your ",(0,o.kt)("inlineCode",{parentName:"p"},"tsconfig.json")," includes the ",(0,o.kt)("inlineCode",{parentName:"p"},"allowJs"),"\noption."),(0,o.kt)("pre",null,(0,o.kt)("code",{parentName:"pre",className:"language-json"},'// tsconfig.json\n\n{\n  "compilerOptions": {\n    "allowJs": true,\n    ...\n  },\n  ...\n}\n')))}u.isMDXComponent=!0}}]);