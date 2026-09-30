const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const source=fs.readFileSync(require.resolve('../app.js'),'utf8');
const validator=source.slice(source.indexOf('function syncDailyRequiredFields(){'),source.indexOf("form.addEventListener('input',syncDailyRequiredFields)"));
const field=value=>({value,required:false,error:'',setCustomValidity(message){this.error=message;}});
function setup(values,amount){
 const controls=values.map(field),radios=[field('Rata ins.'),field('Rata ris.')],money=field(amount),user=field('');
 const row={querySelector:s=>s.includes('amount')?money:s.includes('user')?user:radios.find(x=>x.checked),querySelectorAll:()=>radios};
 const context={soldSubscriptionsRows:{querySelectorAll:()=>controls},installmentsRows:{querySelectorAll:()=>amount===null?[]:[row]}};
 vm.createContext(context);vm.runInContext(validator,context);
 return {controls,radios,money,user,run:()=>context.syncDailyRequiredFields()};
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
test('An enabled empty installment requires amount, user and status',()=>{
 const s=setup([],'');s.run();
 assert.ok(s.money.required&&s.money.error);assert.ok(s.user.required&&s.user.error);assert.ok(s.radios.every(x=>x.required&&x.error));
 s.money.value='120';s.user.value='   ';s.radios[0].checked=true;s.run();assert.ok(s.user.error);assert.equal(s.money.error,'');
 s.user.value='Mario Rossi';s.run();assert.equal(s.user.error,'');assert.ok(s.radios.every(x=>!x.error));
 s.money.value='';s.run();assert.ok(s.money.error);assert.ok(s.radios.every(x=>x.required));
});
