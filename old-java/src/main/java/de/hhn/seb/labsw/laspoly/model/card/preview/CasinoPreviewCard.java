/*
 * Decompiled with CFR 0.152.
 */
package de.hhn.seb.labsw.laspoly.model.card.preview;

import de.hhn.seb.labsw.laspoly.model.card.Card;
import de.hhn.seb.labsw.laspoly.model.field.specialfield.Casino;
import de.hhn.seb.labsw.laspoly.utils.dataloading.FXMLFile;
import java.util.ResourceBundle;

public class CasinoPreviewCard
extends Card {
    private final Casino casino;

    public CasinoPreviewCard(Casino c) {
        this.casino = c;
        this.setNodeHolder(new NodeHolder());
    }

    @Override
    public String toString() {
        return this.getClass().getName() + "{" + "casino=" + this.casino + '}';
    }

    public class NodeHolder
    extends Card.NodeHolder {
        public NodeHolder() {
            super(FXMLFile.PREVIEW_CASINO);
            this.lookUpLabels("#namelabel", "#descriptionlabel", "#winlabel", "#winvaluelabel", "#jackpotlabel", "#jackpotvaluelabel", "#jackpotlabel2");
        }

        @Override
        protected void updateLabelTexts(ResourceBundle res) {
            this.update(this.label(0), res, "casino_name", new Object[0]);
            this.update(this.label(1), res, "casino_money", CasinoPreviewCard.this.casino.getMoneyAmount());
            this.update(this.label(2), res, "casino_double_win", new Object[0]);
            this.label(3).setText(String.valueOf(CasinoPreviewCard.this.casino.getWinForDoubles()));
            this.update(this.label(4), res, "casino_jackpot_sum", new Object[0]);
            this.label(5).setText(String.valueOf(CasinoPreviewCard.this.casino.getJackPot()));
            this.update(this.label(6), res, "casino_jackpot_info", new Object[0]);
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

