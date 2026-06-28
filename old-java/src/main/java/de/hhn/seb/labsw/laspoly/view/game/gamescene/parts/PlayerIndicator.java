/*
 * Decompiled with CFR 0.152.
 * 
 * Could not load the following classes:
 *  javafx.scene.Node
 */
package de.hhn.seb.labsw.laspoly.view.game.gamescene.parts;

import de.hhn.seb.labsw.laspoly.model.Player;
import de.hhn.seb.labsw.laspoly.utils.EnhancedGroup;
import de.hhn.seb.labsw.laspoly.utils.dataloading.DataLoader;
import de.hhn.seb.labsw.laspoly.utils.dataloading.GameSceneModelSource;
import de.hhn.seb.labsw.laspoly.view.paint.Drawable;
import javafx.scene.Node;

public class PlayerIndicator
implements Drawable {
    private final EnhancedGroup playerIndicatorGroup = DataLoader.getInstance().getGameSceneForm(GameSceneModelSource.PLAYER_INDICATOR);

    public PlayerIndicator() {
        this.playerIndicatorGroup.setScale(20.0);
        this.playerIndicatorGroup.setOpacity(0.0);
        this.playerIndicatorGroup.setTy(100.0);
        this.playerIndicatorGroup.setTx(-525.0);
        this.playerIndicatorGroup.setTz(-525.0);
    }

    public void show(Player p) {
        this.playerIndicatorGroup.setTy(p.getFigure().getFigureGroup().getTranslateY() + 100.0);
        this.playerIndicatorGroup.setTx(p.getFigure().getFigureGroup().getTranslateX());
        this.playerIndicatorGroup.setTz(p.getFigure().getFigureGroup().getTranslateZ());
        this.playerIndicatorGroup.setOpacity(1.0);
    }

    public void show() {
        this.playerIndicatorGroup.setTy(50.0);
        this.playerIndicatorGroup.setTx(-525.0);
        this.playerIndicatorGroup.setTz(-525.0);
    }

    public void hide() {
        this.playerIndicatorGroup.setOpacity(0.0);
    }

    @Override
    public Node draw() {
        return this.playerIndicatorGroup;
    }
}

