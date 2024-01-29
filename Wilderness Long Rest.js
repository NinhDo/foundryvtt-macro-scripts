/**
 * Based on the works of prodigal_1 https://old.reddit.com/r/UnearthedArcana/comments/pfmx85/rules_for_rest_in_the_wild_20/
 * Requires the tables "Full Rest Benefits" and "Botched Rest Results"
 */

async function callback(html) {
  ChatMessage.create({
    user: game.user._id,
    speaker: ChatMessage.getSpeaker(),
    content: `${ChatMessage.getSpeaker().alias} is attempting to long rest.`
  }, {});

  let resultRaw = html.find('select[name=\'dcField\']');
  if (resultRaw.val() === '') return;

  const benefitTable = game.tables.getName("Full Rest Benefits");
  const botchedTable = game.tables.getName("Botched Rest Results");
  
  const dc = parseInt(resultRaw.val());

  const conRoll = await game.user.character.rollAbilitySave("con");

  if (!conRoll) {
    ChatMessage.create({
      user: game.user._id,
      speaker: ChatMessage.getSpeaker(),
      content: `${ChatMessage.getSpeaker().alias} - roll cancelled`
    }, {});
    return;
  }

  if (conRoll.isCritical) {
    ChatMessage.create({
      user: game.user._id,
      speaker: ChatMessage.getSpeaker(),
      content: "Gain the normal effects of a long rest, and roll once on the Full Rest Benefits table."
    }, {});
    return await benefitTable.draw()
  }

  if (conRoll.total >= dc) {
    ChatMessage.create({
      user: game.user._id,
      speaker: ChatMessage.getSpeaker(),
      content: "Gain the normal effects of a long rest."
    }, {});
    return;
  }

  const diff = dc - conRoll.total;
  if (diff >= 7) {
    ChatMessage.create({
      user: game.user._id,
      speaker: ChatMessage.getSpeaker(),
      content: "Roll on Botched Rest table. You gain no benefits from resting."
    }, {});
    return await botchedTable.draw()
  }
  if (diff >= 4) {
    ChatMessage.create({
      user: game.user._id,
      speaker: ChatMessage.getSpeaker(),
      content: "Roll on Botched Rest table. You only gain the effects of a short rest."
    }, {});
    return await botchedTable.draw()
  }
  
  ChatMessage.create({
    user: game.user._id,
    speaker: ChatMessage.getSpeaker(),
    content: "Roll on Botched Rest table. You gain all the effects of a long rest, but no new hit dice."
  }, {});
  return await botchedTable.draw()
}



new Dialog({
  title: 'Attempt Long Rest in the Wild',
  content: `
    <form>
      <div class="form-group">
        <label>Set Long Rest DC</label>
        <select name="dcField">
          <option value="6">6</option>
          <option value="10">10</option>
          <option value="18">18</option>
          <option value="24">24</option>
        </select>
      </div>
    </form>`,
  buttons: {
    yes: {
      icon: "<i class='fas fa-check'></i>",
      label: `Attempt Long Rest`,
      callback: (html) => callback(html)
    },
    no: {
      icon: "<i class='fas fa-times'></i>",
      label: `Cancel`
    }
  },
  default: 'yes'
}).render(true);
