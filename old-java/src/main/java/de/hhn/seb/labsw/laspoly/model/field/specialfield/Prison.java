/*
 * Decompiled with CFR 0.152.
 * 
 * Could not load the following classes:
 *  javafx.scene.Cursor
 *  javafx.scene.Group
 */
package de.hhn.seb.labsw.laspoly.model.field.specialfield;

import de.hhn.seb.labsw.laspoly.model.card.Card;
import de.hhn.seb.labsw.laspoly.model.card.preview.PrisonPreviewCard;
import de.hhn.seb.labsw.laspoly.model.field.Field;
import de.hhn.seb.labsw.laspoly.model.field.specialfield.SpecialField;
import de.hhn.seb.labsw.laspoly.model.figure.Figure;
import de.hhn.seb.labsw.laspoly.utils.EnhancedGroup;
import de.hhn.seb.labsw.laspoly.utils.dataloading.DataLoader;
import de.hhn.seb.labsw.laspoly.utils.dataloading.GameSceneModelSource;
import de.hhn.seb.labsw.laspoly.view.game.GameHandler;
import de.hhn.seb.labsw.laspoly.view.game.gamescene.GameScene;
import de.hhn.seb.labsw.laspoly.view.game.gamescene.PreviewManager;
import javafx.scene.Cursor;
import javafx.scene.Group;

public class Prison
extends SpecialField {
    public static final int POSITION = 40;
    private final NodeHolder nodes = new NodeHolder();
    private PrisonPreviewCard previewCard;

    public Prison() {
        super(40);
    }

    @Override
    public Card getPreviewCard() {
        return this.previewCard;
    }

    @Override
    public Card createNewPreviewCard() {
        return new PrisonPreviewCard(this);
    }

    @Override
    public String getName() {
        return GameScene.getResources().getString("prison_name");
    }

    @Override
    public void onFigureEntered(Figure fig, GameHandler handler) {
        handler.enablePlayerCameIntoPrisonThisRound();
        handler.getPlayer(fig.getUser()).setPrisonCounter(3);
    }

    @Override
    public Group draw() {
        if (this.previewCard == null) {
            this.previewCard = new PrisonPreviewCard(this);
        }
        return this.nodes.prison;
    }

    public class NodeHolder
    extends Field.NodeHolder {
        private final EnhancedGroup prison = DataLoader.getInstance().getGameSceneForm(GameSceneModelSource.PRISON);

        protected NodeHolder() {
            this.prison.setOnMouseClicked(e -> PreviewManager.showPreview(Prison.this.previewCard));
            this.prison.setCursor(Cursor.HAND);
        }
    }
}

