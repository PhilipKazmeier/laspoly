/*
 * Decompiled with CFR 0.152.
 */
package de.hhn.seb.labsw.laspoly.model.card;

import de.hhn.seb.labsw.laspoly.model.card.Card;
import de.hhn.seb.labsw.laspoly.utils.dataloading.FXMLFile;
import java.util.ResourceBundle;

public class StartFieldPreviewCard
extends Card {
    public StartFieldPreviewCard() {
        this.setNodeHolder(new NodeHolder());
    }

    @Override
    public String toString() {
        return this.getClass().getName() + "{}";
    }

    public class NodeHolder
    extends Card.NodeHolder {
        public NodeHolder() {
            super(FXMLFile.PREVIEW_START_FIELD);
            this.lookUpLabels("#namelabel", "#startlabel1");
        }

        @Override
        protected void updateLabelTexts(ResourceBundle res) {
            this.update(this.label(0), res, "startfield_name", new Object[0]);
            this.update(this.label(1), res, "carddescription_gofield", 400, 200);
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

