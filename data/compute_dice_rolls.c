#include <stdio.h>
#include <stdlib.h>

int roll() {
    return ((rand() >> 4) % 6);
}

int fullRoll(int numDice) {
    int ret = 0;
    int i;
    for (i = 0; i < numDice; i++) {
        ret += roll();
    }
    return ret;
}



int main(int argc, char **argv) {
    int i;
    srand(2348234);
    int tot = atoi(argv[1]);
    int numLeft;
    int numRight;
    printf("[");
    for (numLeft = 2; numLeft < 16; numLeft++) {
        for (numRight = 2; numRight < 16; numRight++) {
            int wins = 0;
            double ratio;
            for (i = 0; i < tot; i++) {
                wins += fullRoll(numLeft) > fullRoll(numRight) ? 1 : 0;
            }
            ratio = (double)wins / (double)tot;
            printf("{\"left\":%d,\"right\":%d,\"odds\":%f}%s", numLeft, numRight, ratio, 
                    (numLeft != 15 || numRight != 15 ? "," : ""));
        }
    }
    printf("]");
}

