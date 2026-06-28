/*
 * Decompiled with CFR 0.152.
 */
package de.hhn.seb.labsw.laspoly.model.card;

import de.hhn.seb.labsw.laspoly.model.card.Card;
import de.hhn.seb.labsw.laspoly.utils.dataloading.FXMLFile;
import java.util.ResourceBundle;

public class FreeParkingPreviewCard
extends Card {
    public FreeParkingPreviewCard() {
        this.setNodeHolder(new NodeHolder());
    }

    @Override
    public String toString() {
        return this.getClass().getName() + "{}";
    }

    public class NodeHolder
    extends Card.NodeHolder {
        public NodeHolder() {
            super(FXMLFile.PREVIEW_FREE_PARKING);
            this.lookUpLabels("#namelabel", "#infolabel");
        }

        @Override
        protected void updateLabelTexts(ResourceBundle res) {
            this.update(this.label(0), res, "freeparking_name", new Object[0]);
            this.update(this.label(1), res, "carddescription_freeparking", new Object[0]);
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

