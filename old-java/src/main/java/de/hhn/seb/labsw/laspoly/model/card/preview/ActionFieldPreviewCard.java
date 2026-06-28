/*
 * Decompiled with CFR 0.152.
 */
package de.hhn.seb.labsw.laspoly.model.card.preview;

import de.hhn.seb.labsw.laspoly.model.card.Card;
import de.hhn.seb.labsw.laspoly.utils.dataloading.FXMLFile;
import java.util.ResourceBundle;

public class ActionFieldPreviewCard
extends Card {
    public ActionFieldPreviewCard() {
        this.setNodeHolder(new NodeHolder());
    }

    @Override
    public String toString() {
        return this.getClass().getName() + "{}";
    }

    public class NodeHolder
    extends Card.NodeHolder {
        public NodeHolder() {
            super(FXMLFile.PREVIEW_ACTION_FIELD);
            this.lookUpLabels("#namelabel", "#startlabel1");
        }

        @Override
        protected void updateLabelTexts(ResourceBundle res) {
            this.label(0).setText(res.getString("actionfield_name"));
            this.label(1).setText(res.getString("carddescription_actioncardfield"));
        }

        @Override
        protected int[] getLabelsFromInterest() {
            return new int[0];
        }

        @Override
        public String toString() {
            return this.getClass().getName() + "{}";
        }
    }
}

