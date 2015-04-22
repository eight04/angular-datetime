angular.module("datetime").directive("datetime", function(){
	return {
		restrict: "A",
		require: "?ngModel",
		link: function(scope, element, ngModel) {

		}
	};
});
