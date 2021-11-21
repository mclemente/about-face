//injectConfig library by @theripper93
//License: MIT
//Documentation: https://github.com/theripper93/injectConfig

export var injectConfig = {
	inject: function injectConfig(app, html, data, object) {
		object = object || app.object;
		const moduleId = data.moduleId;
		let injectPoint;
		if (typeof data.inject === "string") {
			injectPoint = html.find(data.inject).first().closest(".form-group");
		} else {
			injectPoint = data.inject;
		}
		injectPoint = injectPoint ? $(injectPoint) : data.tab ? html.find(".tab").last() : html.find(".form-group").last();
		let injectHtml = "";
		for (const [k, v] of Object.entries(data)) {
			if (k === "moduleId" || k === "inject" || k === "tab") continue;
			const elemData = data[k];
			const flag = "flags." + moduleId + "." + (k || "");
			const flagValue = object?.getFlag(moduleId, k) ?? elemData.default ?? getDefaultFlag(k);
			const notes = v.notes ? `<p class="notes">${v.notes}</p>` : "";
			switch (elemData.type) {
				case "text":
					injectHtml += `<div class="form-group">
                        <label for="${k}">${v.label || ""}</label>
                            <input type="text" name="${flag}" value="${flagValue}" placeholder="${v.placeholder || ""}">${notes}
                    </div>`;
					break;
				case "number":
					injectHtml += `<div class="form-group">
                        <label for="${k}">${v.label || ""}</label>
                            <input type="number" name="${flag}" min="${v.min}" max="${v.max}" step="${v.step ?? 1}" value="${flagValue}" placeholder="${
						v.placeholder || ""
					}">${notes}
                    </div>`;
					break;
				case "checkbox":
					injectHtml += `<div class="form-group">
                        <label for="${k}">${v.label || ""}</label>
                            <input type="checkbox" name="${flag}" ${flagValue ? "checked" : ""}>${notes}
                    </div>`;
					break;
				case "select":
					injectHtml += `<div class="form-group">
                        <label for="${k}">${v.label || ""}</label>
                            <select name="${flag}">`;
					for (const [i, j] of Object.entries(v.options)) {
						injectHtml += `<option value="${i}" ${flagValue === i ? "selected" : ""}>${j}</option>`;
					}
					injectHtml += `</select>${notes}
                    </div>`;
					break;
				case "range":
					injectHtml += `<div class="form-group">
                        <label for="${k}">${v.label || ""}</label>
                        <div class="form-fields">
                            <input type="range" name="${flag}" value="${flagValue}" min="${v.min}" max="${v.max}" step="${v.step ?? 1}">
                            <span class="range-value">${flagValue}</span>${notes}
                        </div>
                    </div>`;
					break;
				case "color":
					injectHtml += `<div class="form-group">
                        <label for="${k}">${v.label || ""}</label>
                        <div class="form-fields">
                            <input class="color" type="text" name="${flag}" value="${flagValue}">
                            <input type="color" data-edit="${flag}" value="${flagValue}">
                        </div>
                        ${notes}
                    </div>`;
					break;
				case "custom":
					injectHtml += v.html;
					break;
			}
			if (elemData.type?.includes("filepicker")) {
				const fpType = elemData.type.split(".")[1] || "imagevideo";
				injectHtml += `<div class="form-group">
                <label for="${k}">${v.label || ""}</label>
                <div class="form-fields">     
                    <button type="button" class="file-picker" data-type="${fpType}" data-target="${flag}" title="Browse Files" tabindex="-1">
                        <i class="fas fa-file-import fa-fw"></i>
                    </button>
                    <input class="image" type="text" name="${flag}" placeholder="${v.placeholder || ""}" value="${flagValue}">
                </div>${notes}
            </div>`;
			}
		}
		injectHtml = $(injectHtml);
		injectHtml.on("click", ".file-picker", _bindFilePicker);
		injectHtml.on("change", `input[type="color"]`, _colorChange);
		if (data.tab) {
			const injectTab = createTab(data.tab.name, data.tab.label, data.tab.icon).append(injectHtml);
			injectPoint.after(injectTab);
			app?.setPosition({ height: "auto", width: data.tab ? app.options.width + 100 : "auto" });
			return injectHtml;
		}
		injectPoint.after(injectHtml);
		app?.setPosition({ height: "auto", width: data.tab ? app.options.width + 100 : "auto" });
		return injectHtml;

		function createTab(name, label, icon) {
			/*let tabs = html.find(".sheet-tabs").last();
            if(!tabs.length) tabs = html.find(`nav[data-group="main"]`);*/
			const tabs = html.find(".sheet-tabs").first().find(".item").last();
			const tab = `<a class="item" data-tab="${name}"><i class="${icon}"></i> ${label}</a>`;
			tabs.after(tab);
			const tabContainer = `<div class="tab" data-tab="${name}"></div>`;
			return $(tabContainer);
		}

		function getDefaultFlag(inputType) {
			switch (inputType) {
				case "number":
					return 0;
				case "checkbox":
					return false;
			}
			return "";
		}

		function _colorChange(e) {
			const input = $(e.target);
			const edit = input.data("edit");
			const value = input.val();
			injectHtml.find(`input[name="${edit}"]`).val(value);
		}

		function _bindFilePicker(event) {
			event.preventDefault();
			const button = event.currentTarget;
			const input = $(button).closest(".form-fields").find("input") || null;
			const options = {
				field: input[0],
				type: button.dataset.type,
				current: input.val() || null,
				button: button,
			};
			const fp = new FilePicker(options);
			return fp.browse();
		}
	},
	quickInject: function quickInject(injectData, data) {
		injectData = Array.isArray(injectData) ? injectData : [injectData];
		for (const doc of injectData) {
			let newData = data;
			if (doc.inject) {
				newData = JSON.parse(JSON.stringify(data));
				data.inject = doc.inject;
			}
			Hooks.on(`render${doc.documentName}Config`, (app, html) => {
				injectConfig.inject(app, html, newData);
			});
		}
	},
};
