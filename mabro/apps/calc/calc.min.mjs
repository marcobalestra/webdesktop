const newCalcOptions={minWidth:"260px",minHeight:"180px",width:"320px",height:"200px"},makeCalc=(co,$c)=>{const $out=$(`<div class="p-2">
	<div class="btn-toolbar" role="toolbar">
		<div class="btn-group btn-group-sm mr-2" role="group">
			<button type="button" class="btn btn-warning calc-clear">C</button>
			<button type="button" class="btn btn-warning calc-mclear">MC</button>
			<button type="button" class="btn btn-warning calc-allclear">AC</button>
		</div>
		<div class="btn-group btn-group-sm" role="group">
			<button type="button" class="btn btn-secondary calc-mplus">M+</button>
			<button type="button" class="btn btn-secondary calc-mminus">M-</button>
			<button type="button" class="btn btn-secondary calc-mrecall">MR</button>
		</div>
	</div>
	<div class="mt-1 mb-1 calc-memory">
		<span>M: </span>
		<span class="calc-mcontent"></span>
	</div>
	</div>`),$input=$('<input class="form-control calc-input" type="text" />');$input.on("change",()=>{doCalc($c)}),$input.bind("keydown",e=>{switch(e.originalEvent.key){case"=":return e.preventDefault(),void doCalc($c);case"Clear":return e.preventDefault(),void clearCalc($c);case"F13":case"F16":return e.preventDefault(),void mPlus($c);case"F14":case"F17":return e.preventDefault(),void mMinus($c);case"F15":case"F18":return e.preventDefault(),void mRecall($c)}}),$(".calc-clear",$out).on("click",()=>{clearCalc($c)}),$(".calc-mclear",$out).on("click",()=>{$(".calc-mcontent",$out).html(""),$input.focus()}),$(".calc-allclear",$out).on("click",()=>{$(".calc-mcontent",$out).html(""),clearCalc($c)}),$(".calc-mplus",$out).on("click",()=>{mPlus($c)}),$(".calc-mminus",$out).on("click",()=>{mMinus($c)}),$(".calc-mrecall",$out).on("click",()=>{mRecall($c)}),$out.append($input),$out.append('<div class="calc-error"></div>'),$c.append($out),setTimeout(()=>{$input.focus()},100)},mPlus=$c=>{let v=doCalc($c);if("string"==typeof v&&(v=parseFloat(v)),"number"==typeof v){const $m=$(".calc-mcontent",$c);let m=parseFloat($m.html()||"0");isNaN(m)&&(m=0),$m.html(String(m+v)),$("input.calc-input",$c).select()}},mMinus=$c=>{let v=doCalc($c);if("string"==typeof v&&(v=parseFloat(v)),"number"==typeof v){const $m=$(".calc-mcontent",$c);let m=parseFloat($m.html()||"0");isNaN(m)&&(m=0),$m.html(String(m-v)),$("input.calc-input",$c).select()}},mRecall=$c=>{const $m=$(".calc-mcontent",$c);var v=$m.html();const $input=$("input.calc-input",$c);v.length&&$input.val($input.val()+v),$input.focus()},doCalc=$c=>{const $input=$("input.calc-input",$c);if(""===$input.val())return clearCalc($c);const $err=$("div.calc-error",$c);try{$input.val(eval($input.val())),$err.html("")}catch(e){return $err.html(e.message),void $input.focus()}return $input.focus(),$input.val()},clearCalc=$c=>{$("div.calc-error",$c).html(""),$("input.calc-input",$c).val("").focus()},getClass=async mb=>{return class{#prop;#api;constructor(api,options){this.#prop={options:options||{}},this.#api=api}init(){this.#api.menubar([{label:"File",items:[{label:"New",action:()=>{this.newCalc()}}]}]),this.newCalc()}newCalc(){const w=this.#api.newWindow(newCalcOptions);makeCalc(this,w.window()),w.show()}}};export default getClass;