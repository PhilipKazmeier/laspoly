/*
 * Decompiled with CFR 0.152.
 */
package de.hhn.seb.labsw.laspoly.model.card.preview;

import de.hhn.seb.labsw.laspoly.model.card.Card;
import de.hhn.seb.labsw.laspoly.utils.dataloading.FXMLFile;
import java.util.ResourceBundle;

public class GoToPrisonPreviewCard
extends Card {
    public GoToPrisonPreviewCard() {
        this.setNodeHolder(new NodeHolder());
    }

    @Override
    public String toString() {
        return this.getClass().getName() + "{}";
    }

    public class NodeHolder
    extends Card.NodeHolder {
        public NodeHolder() {
            super(FXMLFile.PREVIEW_GO_TO_PRISON_FIELD);
            this.lookUpLabels("#namelabel", "#infolabel1");
        }

        @Override
        protected void updateLabelTexts(ResourceBundle res) {
            this.label(0).setText(res.getString("gotoprison_name"));
            this.label(1).setText(res.getString("carddescription_police"));
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

