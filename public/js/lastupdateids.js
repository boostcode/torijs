var lastUpdateFarmaci = 'ff7bc56f-d645-407c-b8b9-7026eb9a4bb6';
var lastUpdateFarmacie = '0b42534c-516f-4a2c-bb14-41a44d139faf';

function updateFarmaci() {
	
}

function updateFarmacie() {
	
	BaasBox.updateField(lastUpdateFarmacie, 'aggiornamenti', 'lastUpdate', new Date().getTime(), function(res, err){
		if(err){
			console.log(err);
		}
	});
}