/**
 * This file is part of Webelexis
 * Copyright (c) 2015 by G. Weiricg
 */

/**
 * custom binding (http://knockoutjs.com/documentation/custom-bindings.html) to embed the trumbowyg Editor in a knockout component.
 */
define(['knockout', 'tbw'], function (ko) {

	var Editor = function (textObservable) {
		var self = this;

		ko.bindingHandlers.trumbowyg = {

			init: function (element, valueAccessor, allBindings) {
				$(element).trumbowyg()
				$(element).trumbowyg('html', "init")
			},

			update: function (element, valueAccessor, allBindings) {
				$(element).trumbowyg('html', textObservable())
			}

		}
		self.getText = function () {
			return self.content;
		}

	}
	return Editor;
})
