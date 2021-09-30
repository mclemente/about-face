import { MODULE_ID } from "./settings.js";

export function renderSceneConfig(app, html) {
	let sceneEnabled = app.object.data?.flags?.[MODULE_ID]?.sceneEnabled ?? true;
	const fxHtml = `
        <h3 class="form-header"><i class="fas fa-caret-down fa-fw"/></i> About Face</h3>
		<p class="notes">${game.i18n.localize("about-face.sceneConfig.hint")}</p>
    <div class="form-group">
        <label>${game.i18n.localize("about-face.sceneConfig.scene-enabled.name")}</label>
        <input id="about-face-enabled" type="checkbox" name="AF_Enabled" data-dtype="Boolean" ${sceneEnabled ? "checked" : ""}>
        <p class="notes">${game.i18n.localize("about-face.sceneConfig.scene-enabled.hint")}</p>
    </div>`;

	const initPositionClass = html.find('div[class="form-group initial-position"]');
	initPositionClass.after(fxHtml);
}

export async function closeSceneConfig(app, html) {
	let sceneEnabled = html.find("input[name ='AF_Enabled']").is(":checked");
	await app.object.setFlag(MODULE_ID, "sceneEnabled", sceneEnabled);
}
