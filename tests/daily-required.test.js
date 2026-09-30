const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const source=fs.readFileSync(require.resolve('../app.js'),'utf8');
const validator=source.slice(source.indexOf('function syncDailyRequiredFields(){'),source.indexOf("form.addEventListener('input',syncDailyRequiredFields)"));
const field=value=>({value,required:false,error:'',setCustomValidity(message){this.error=message;}});
function setup(values,amount){
 const controls=values.map(field),radios=[field('Rata ins.'),field('Rata ris.')],money=field(amount);
 const row={querySelector:s=>s.includes('amount')?money:radios.find(x=>x.checked),querySelectorAll:()=>radios};
 const context={soldSubscriptionsRows:{querySelectorAll:()=>controls},installmentsRows:{querySelectorAll:()=>amount===null?[]:[row]}};
 vm.createContext(context);vm.runInContext(validator,context);
 return {controls,radios,money,run:()=>context.syncDailyRequiredFields()};
}
test('Every enabled subscription field rejects empty placeholders and whitespace',()=>{
 const s=setup(['Percorso','','   '],null);s.run();
 assert.ok(s.controls.every(x=>x.required));assert.equal(s.controls[0].error,'');assert.ok(s.controls[1].error);assert.ok(s.controls[2].error);
 s.controls[1].value='Rinnovo';s.controls[2].value='Passaparola';s.run();assert.ok(s.controls.every(x=>!x.error));
});
test('No enabled rows means no required details',()=>{setup([],null).run();});
test('Entered amount including zero requires a status; either status is accepted',()=>{
 for(const amount of ['0','120']){const s=setup([],amount);s.run();assert.ok(s.radios.every(x=>x.required&&x.error));
 for(const radio of s.radios){s.radios.forEach(x=>x.checked=false);radio.checked=true;s.run();assert.ok(s.radios.every(x=>!x.error));}}
});
test('Clearing an amount removes its status requirement and stale error',()=>{
 const s=setup([],'120');s.run();s.money.value='';s.run();assert.ok(s.radios.every(x=>!x.required&&!x.error));
});
