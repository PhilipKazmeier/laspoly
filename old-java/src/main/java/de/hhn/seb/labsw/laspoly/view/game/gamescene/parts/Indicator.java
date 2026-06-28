/*
 * Decompiled with CFR 0.152.
 * 
 * Could not load the following classes:
 *  javafx.animation.Interpolator
 *  javafx.animation.Transition
 *  javafx.scene.Node
 *  javafx.util.Duration
 */
package de.hhn.seb.labsw.laspoly.view.game.gamescene.parts;

import de.hhn.seb.labsw.laspoly.utils.EnhancedGroup;
import de.hhn.seb.labsw.laspoly.utils.dataloading.DataLoader;
import de.hhn.seb.labsw.laspoly.utils.dataloading.GameSceneModelSource;
import de.hhn.seb.labsw.laspoly.view.paint.Drawable;
import javafx.animation.Interpolator;
import javafx.animation.Transition;
import javafx.scene.Node;
import javafx.util.Duration;

public class Indicator
implements Drawable {
    private final EnhancedGroup indicatorGroup = DataLoader.getInstance().getGameSceneForm(GameSceneModelSource.INDICATOR);
    private Transition rotateTransition;

    public Indicator() {
        this.indicatorGroup.setOpacity(0.0);
        this.indicatorGroup.setScale(40.0);
    }

    public void showIndicator(IndicatorPosition indicatorPosition) {
        this.indicatorGroup.setTy(indicatorPosition.tY);
        this.indicatorGroup.setTx(indicatorPosition.tX);
        this.indicatorGroup.setTz(indicatorPosition.tZ);
        this.playAnimation();
        this.indicatorGroup.setOpacity(1.0);
    }

    public void hide() {
        this.indicatorGroup.setOpacity(0.0);
    }

    public void playAnimation() {
        if (this.rotateTransition != null) {
            this.rotateTransition.stop();
        }
        this.rotateTransition = new Transition(50.0){
            {
                this.setInterpolator(Interpolator.LINEAR);
                this.setCycleDuration(Duration.INDEFINITE);
            }

            protected void interpolate(double frac) {
                if (Indicator.this.indicatorGroup.getOpacity() == 1.0) {
                    Indicator.this.indicatorGroup.getRy().setAngle(Indicator.this.indicatorGroup.getRy().getAngle() % 360.0 - 0.72);
                }
            }
        };
        this.rotateTransition.play();
    }

    @Override
    public Node draw() {
        return this.indicatorGroup;
    }

    public static enum IndicatorPosition {
        POSITION_DICE_CUP(250, -240, -250),
        POSITION_CARD_DECK(50, 230, 235),
        POSITION_DICE(80, -250, -200);

        private final int tX;
        private final int tY;
        private final int tZ;

        private IndicatorPosition(int y, int x, int z) {
            this.tX = x;
            this.tY = y;
            this.tZ = z;
        }
    }
}

