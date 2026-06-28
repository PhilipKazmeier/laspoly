/*
 * Decompiled with CFR 0.152.
 */
package de.hhn.seb.labsw.laspoly.model.card;

import de.hhn.seb.labsw.laspoly.model.card.Card;
import de.hhn.seb.labsw.laspoly.utils.dataloading.FXMLFile;
import java.util.ResourceBundle;

public class PayToCasinoCard
extends Card {
    public PayToCasinoCard() {
        this.setNodeHolder(new NodeHolder());
    }

    @Override
    public String toString() {
        return this.getClass().getName() + "{}";
    }

    public class NodeHolder
    extends Card.NodeHolder {
        public NodeHolder() {
            super(FXMLFile.PREVIEW_PAY_TO_CASINO_FIELD);
            this.lookUpLabels("#namelabel", "#infolabel");
        }

        @Override
        protected void updateLabelTexts(ResourceBundle res) {
            this.label(0).setText(res.getString("paycasino_fieldname"));
            this.label(1).setText(res.getString("carddescription_casinopay"));
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

